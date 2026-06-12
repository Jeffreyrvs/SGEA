import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { PerfilesModule } from '../perfiles/perfiles.module';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService],
  imports: [PerfilesModule],
})
export class ReportesModule {}
