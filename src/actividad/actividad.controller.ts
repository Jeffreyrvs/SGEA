import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Headers, ParseUUIDPipe } from '@nestjs/common';
import { ActividadService } from './actividad.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { StatusActividad } from './enum/status.enum';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

@UseGuards(SupabaseAuthGuard)
@Controller('actividad')
export class ActividadController {
  constructor(private readonly actividadService: ActividadService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) { }

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

  @Post(':id/exportar-calendar')
  async exportarACalendar(@Param('id') id: number) {
    const actividad = await this.actividadService.findOne(id.toString());
    const eventoId = await this.googleCalendarService.exportarActividad(actividad,id);
    return { mensaje: 'Exportado exitosamente', eventoId };
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

  @Get('materia/:id_materia')
  findByMateria(
    @Param('id_materia', ParseUUIDPipe) id_materia: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.findByMateria(id_materia, token);
  }

  @Get('usuario/:id_usuario')
  findByUsuario(
    @Param('id_usuario', ParseUUIDPipe) id_usuario: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.findByUsuario(id_usuario, token);
  }

  @Get('equipo/:equipoId')
  findByEquipo(
    @Param('equipoId', ParseUUIDPipe) equipoId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.findByEquipo(equipoId, token);
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
