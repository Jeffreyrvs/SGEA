import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Actividad } from '../actividad/entities/actividad.entity';

interface CalendarUser {
    googleRefreshToken?: string;
    googleAccessToken?: string;
}

@Injectable()
export class GoogleCalendarService {
    private readonly logger = new Logger(GoogleCalendarService.name);

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

    async exportarActividad(actividad: Actividad, idActividad: number){
        try {
            const oauth2Client = this.getClientAutenticado({
                googleAccessToken: process.env.GOOGLE_ACCESS_TOKEN,
                googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            });} catch (error) {
            this.logger.error('Error al autenticar con Google Calendar', error);
            throw new UnauthorizedException('No se pudo autenticar con Google Calendar');
        }
    
       
    
}
}