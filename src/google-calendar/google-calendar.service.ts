import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { Actividad } from '../actividad/entities/actividad.entity.js';
import { SupabaseService } from '../supabase/supabase.service.js';

interface CalendarUser {
    googleRefreshToken?: string;
    googleAccessToken?: string;
}

@Injectable()
export class GoogleCalendarService {
    private readonly logger = new Logger(GoogleCalendarService.name);

    constructor(private readonly supabaseService: SupabaseService) {}

    private getClientAutenticado(usuario: CalendarUser) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL,
        );

        if (!usuario.googleRefreshToken) {
            throw new UnauthorizedException(
                'El usuario no tiene permisos de calendario. Debe autenticarse con Google primero.',
            );
        }

        oauth2Client.setCredentials({
            access_token: usuario.googleAccessToken,
            refresh_token: usuario.googleRefreshToken,
        });

        return oauth2Client;
    }

    private mapearActividad(actividad: Actividad) {
        const inicio = new Date(actividad.fecha_entrega);
        const duracionMs = actividad.tiempo_estimado
            ? actividad.tiempo_estimado * 60 * 1000 
            : 60 * 60 * 1000;                         // 1 hora por defecto
        const fin = new Date(inicio.getTime() + duracionMs);

        // Construir descripción enriquecida con los campos disponibles
        const partes: string[] = [];

        if (actividad.descripcion)
            partes.push(` ${actividad.descripcion}`);

        if (actividad.tipo)
            partes.push(` Tipo: ${actividad.tipo}`);

        if (actividad.dificultad)
            partes.push(` Dificultad: ${'⭐'.repeat(actividad.dificultad)} (${actividad.dificultad}/5)`);

        if (actividad.importancia)
            partes.push(` Importancia: ${actividad.importancia}`);

        if (actividad.puntaje_contenido)
            partes.push(` Puntaje: ${actividad.puntaje_contenido}`);

        if (actividad.tiempo_estimado)
            partes.push(` Tiempo estimado: ${actividad.tiempo_estimado} min`);

        if (actividad.estatus)
            partes.push(` Estatus: ${actividad.estatus}`);

        const descripcionFinal = partes.join('\n');

        return {
            summary: actividad.nombre,
            description: descripcionFinal,
            start: {
                dateTime: inicio.toISOString(),
                timeZone: 'America/Mexico_City',
            },
            end: {
                dateTime: fin.toISOString(),
                timeZone: 'America/Mexico_City',
            },
            // ID único y estable: si ya fue exportada antes, Google Calendar
            // actualiza el evento en lugar de crear uno duplicado
            id: `actividad-${actividad.id}`.replace(/[^a-z0-9]/gi, '').toLowerCase(),
            colorId: this.mapearColorPorDificultad(actividad.dificultad),
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 },   // 1 hora antes
                    { method: 'popup', minutes: 1440 }, // 1 día antes
                ],
            },
        };
    }

    private mapearColorPorDificultad(dificultad?: number): string {
        if (!dificultad) return '9'; 
        if (dificultad <= 2) return '10'; 
        if (dificultad <= 4) return '11'; 
        return '5'; 
    }

    async exportarActividad(actividad: Actividad, usuarioId: string) {
  // 1. Obtener tokens del usuario desde Supabase
  const supabase = this.supabaseService.getClient(); // service role
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', usuarioId)
    .single();

  if (error || !usuario?.google_refresh_token) {
    throw new UnauthorizedException(
      'El usuario no ha conectado Google Calendar. Visita /auth/google/connect',
    );
  }

  // 2. Construir cliente autenticado con los tokens del usuario
  let oauth2Client;
  try {
    oauth2Client = this.getClientAutenticado({
      googleAccessToken:  usuario.google_access_token,
      googleRefreshToken: usuario.google_refresh_token,
    });
  } catch (err) {
    throw new UnauthorizedException('Error al autenticar con Google Calendar');
  }

  // 3. Auto-refresh: si el access_token expiró, googleapis lo renueva solo
  //    pero necesitamos persistir el nuevo token
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await supabase
        .from('usuarios')
        .update({
          google_access_token: tokens.access_token,
          google_token_expiry: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
        })
        .eq('id', usuarioId);
    }
  });

  // 4. El resto queda igual que tenías
  const event    = this.mapearActividad(actividad);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: event.id,
      requestBody: event,
    });
    return response.data.id;
  } catch (error: any) {
    if (error.status === 404 || error.response?.status === 404) {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      return response.data.id;
    }
    this.logger.error('Error al exportar actividad', error);
    throw new InternalServerErrorException('Error al exportar actividad a Google Calendar');
  }
}
}