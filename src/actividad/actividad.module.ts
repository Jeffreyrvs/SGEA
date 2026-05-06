import { Module } from '@nestjs/common';
import { ActividadController } from './actividad.controller';
import { ActividadService } from './actividad.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ActividadController],
  providers: [ActividadService],
  exports: [ActividadService]
})
export class ActividadModule { }
