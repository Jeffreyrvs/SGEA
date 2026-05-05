import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Funcion para el registro
  async register(dto: RegisterDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          display_name: dto.username, // Se guarda en user_metadata
        }
      }
    });

    if (error) throw new BadRequestException(error.message);

    return { message: 'Registro exitoso. Revisa tu correo para confirmar cuenta' };
  }

  async login(dto: LoginDto) {
    const supabase = this.supabaseService.getClient(); 

    // Verificar si está bloqueado antes de intentar
    this.verificarBloqueo(dto.email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password
    });

    if (error) {
      //Verificar que el correo esta confirmado
      if (error.message.includes('Email not confirmed')) {
        throw new UnauthorizedException('Debe verificar su correo antes de iniciar sesion');
      }
      // Registrar intento fallido
      this.registrarIntentoFallido(dto.email);
      // Mensaje genérico
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Login exitoso — limpiar intentos fallidos
    this.limpiarIntentos(dto.email);

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    };

  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.auth.resetPasswordForEmail(dto.email, {
      redirectTo: dto.redirectTo,
    });

    if (error) throw new BadRequestException(error.message);

    // Mensaje genérico para evitar enumeración de correos
    return { message: 'Si el correo existe, recibirás un enlace de recuperación en tu bandeja de entrada' };
  }

  // Mapa en memoria para rastrear intentos fallidos
  private loginAttempts = new Map<string, { intentos: number; primerIntento: number }>();

  private readonly MAX_INTENTOS = 5;
  private readonly BLOQUEO_MS = 30 * 60 * 1000; // 30 minutos en ms

  private verificarBloqueo(email: string): void {
    const registro = this.loginAttempts.get(email);
    if (!registro) return;

    const tiempoTranscurrido = Date.now() - registro.primerIntento;

    // Si ya pasaron 30 minutos, limpiar el registro
    if (tiempoTranscurrido > this.BLOQUEO_MS) {
      this.loginAttempts.delete(email);
      return;
    }

    // Si hay 5 o más intentos fallidos, bloquear
    if (registro.intentos >= this.MAX_INTENTOS) {
      const minutosRestantes = Math.ceil((this.BLOQUEO_MS - tiempoTranscurrido) / 60000);
      throw new UnauthorizedException(
        `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minutos`,
      );
    }
  }

  private registrarIntentoFallido(email: string): void {
    const registro = this.loginAttempts.get(email);

    if (!registro) {
      this.loginAttempts.set(email, { intentos: 1, primerIntento: Date.now() });
      return;
    }

    this.loginAttempts.set(email, {
      intentos: registro.intentos + 1,
      primerIntento: registro.primerIntento,
    });
  }

  private limpiarIntentos(email: string): void {
    this.loginAttempts.delete(email);
  }

}
