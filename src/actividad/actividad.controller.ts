import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Headers } from '@nestjs/common';
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
  findAll() {
    return this.actividadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actividadService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateActividadDto: UpdateActividadDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.update(id, updateActividadDto, token);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: StatusActividad,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.updateStatus(id, status, token);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.actividadService.remove(id, token);
  }
}
