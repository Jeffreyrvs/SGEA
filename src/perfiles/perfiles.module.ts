import { Module } from '@nestjs/common';
import { PerfilesController } from './perfiles.controller';
import { PerfilesService } from './perfiles.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

@Module({
  controllers: [PerfilesController],
  providers: [PerfilesService, SupabaseAuthGuard],
  exports: [PerfilesService],
})
export class PerfilesModule {}
