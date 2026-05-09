import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SubtareaController } from './subtarea.controller';
import { SubtareaService } from './subtarea.service';

@Module({
  imports: [SupabaseModule],
  controllers: [SubtareaController],
  providers: [SubtareaService],
  exports: [SubtareaService],
})
export class SubtareaModule {}
