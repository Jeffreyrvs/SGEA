import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Headers, ParseUUIDPipe } from '@nestjs/common';
import { ActividadService } from './actividad.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { StatusActividad } from './enum/status.enum';

@UseGuards(SupabaseAuthGuard)
@Controller('actividad')
export class ActividadController {
  constructor(private readonly actividadService: ActividadService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @User() user: { id: string },
    @Body() createActividadDto: CreateActividadDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.create(createActividadDto, user.id, token);
  }

  @Get()
  findAll(
    @User() user: { id: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.findAll(user.id, token);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.findOne(id, token);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateActividadDto: UpdateActividadDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.update(id, updateActividadDto, token);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estatus') estatus: StatusActividad,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.updateStatus(id, estatus, token);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.remove(id, token);
  }
}
