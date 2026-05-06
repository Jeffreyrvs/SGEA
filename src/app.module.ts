import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { MateriasModule } from './materias/materias.module';
import { PerfilesModule } from './perfiles/perfiles.module';
import { ActividadModule } from './actividad/actividad.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SupabaseModule,
    MateriasModule,
    PerfilesModule,
    ActividadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
