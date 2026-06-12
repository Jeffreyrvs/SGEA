import { Controller, Get, Query, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { google } from 'googleapis';
import { SupabaseService } from '../../supabase/supabase.service.js';

@Controller('auth/google')
export class AuthGoogleController {
  constructor(private readonly supabaseService: SupabaseService) {}

  private buildOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL, // ej: http://localhost:3000/auth/google/callback
    );
  }

  // Paso 1: el usuario hace click en "Conectar Google Calendar"
  // GET /auth/google/connect?userId=<uuid>
  @Get('connect')
  conectar(@Query('userId') userId: string, @Res() res: Response) {
    const oauth2Client = this.buildOAuthClient();

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',   // para recibir refresh_token
      prompt: 'consent',        // fuerza el reenvío del refresh_token
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: userId,            // pasamos el userId para recuperarlo en el callback
    });

    return res.redirect(url);
  }

  // Paso 2: Google redirige aquí con el code
  // GET /auth/google/callback?code=...&state=<userId>
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    if (!code || !userId) throw new UnauthorizedException('Faltan parámetros');

    const oauth2Client = this.buildOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // Guardamos los tokens en la fila del usuario en Supabase
    const supabase = this.supabaseService.getClient(); // cliente con service role
    const { error } = await supabase
      .from('usuarios')
      .update({
        google_access_token:  tokens.access_token,
        google_refresh_token: tokens.refresh_token,   // solo llega la primera vez con prompt:'consent'
        google_token_expiry:  tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      })
      .eq('id', userId);

    if (error) throw new UnauthorizedException('No se pudo guardar el token');

    // Redirige al frontend con éxito
    return res.redirect(`${process.env.FRONTEND_URL}/calendar-connected`);
  }
}