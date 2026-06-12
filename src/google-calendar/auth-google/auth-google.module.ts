import { Module } from '@nestjs/common';
import { AuthGoogleController } from './auth-google.controller.js';
import { SupabaseModule } from '../../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthGoogleController],
})
export class AuthGoogleModule {}