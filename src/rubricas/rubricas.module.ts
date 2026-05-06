import { Module } from '@nestjs/common';
import { RubricasController } from './rubricas.controller';
import { RubricasService } from './rubricas.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [RubricasController],
  providers: [RubricasService],
  exports: [RubricasService]
})
export class RubricasModule { }
