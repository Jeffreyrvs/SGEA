import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { SubtareaService } from './subtarea.service';
import { CreateSubtareaDto } from './dto/create-subtarea.dto';
import { UpdateSubtareaDto } from './dto/update-subtarea.dto';
import { CompletadoDto } from './dto/completado.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('actividad/:actividadId/subtareas')
export class SubtareaController {
  constructor(private readonly subtareaService: SubtareaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('actividadId', ParseUUIDPipe) actividadId: string,
    @User() user: { id: string },
    @Body() dto: CreateSubtareaDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.subtareaService.create(actividadId, dto, user.id, token);
  }

  @Get()
  findAll(
    @Param('actividadId', ParseUUIDPipe) actividadId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.subtareaService.findAll(actividadId, token);
  }

  @Patch(':subtareaId')
  update(
    @Param('actividadId', ParseUUIDPipe) actividadId: string,
    @Param('subtareaId', ParseUUIDPipe) subtareaId: string,
    @User() user: { id: string },
    @Body() dto: UpdateSubtareaDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.subtareaService.update(actividadId, subtareaId, dto, user.id, token);
  }

  @Patch(':subtareaId/completado')
  setCompletado(
    @Param('actividadId', ParseUUIDPipe) actividadId: string,
    @Param('subtareaId', ParseUUIDPipe) subtareaId: string,
    @User() user: { id: string },
    @Body() dto: CompletadoDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.subtareaService.setCompletado(actividadId, subtareaId, dto.completado, user.id, token);
  }

  @Delete(':subtareaId')
  remove(
    @Param('actividadId', ParseUUIDPipe) actividadId: string,
    @Param('subtareaId', ParseUUIDPipe) subtareaId: string,
    @User() user: { id: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.subtareaService.remove(actividadId, subtareaId, user.id, token);
  }
}
