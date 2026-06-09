import { Module } from '@nestjs/common';
import { ActividadController } from './actividad.controller';
import { ActividadService } from './actividad.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';

@Module({
  imports: [SupabaseModule, GoogleCalendarModule],
  controllers: [ActividadController],
  providers: [ActividadService],
  exports: [ActividadService]
})
export class ActividadModule { }
