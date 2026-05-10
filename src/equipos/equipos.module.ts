import { Module } from '@nestjs/common';
import { EquiposController } from './equipos.controller';
import { EquiposService } from './equipos.service';
import { PerfilesModule } from '../perfiles/perfiles.module';

@Module({
  controllers: [EquiposController],
  providers: [EquiposService],
  imports: [PerfilesModule],
})
export class EquiposModule {}
