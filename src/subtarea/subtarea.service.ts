import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateSubtareaDto } from './dto/create-subtarea.dto';
import { UpdateSubtareaDto } from './dto/update-subtarea.dto';

@Injectable()
export class SubtareaService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private async fetchActividad(actividadId: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('id', actividadId)
      .single();

    if (error || !data) throw new NotFoundException('Actividad no encontrada');
    return data;
  }

  private assertOwner(actividad: { usuario_id: string }, userId: string) {
    if (actividad.usuario_id !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar esta actividad');
    }
  }

  private async assertTeamMember(
    equipoId: string,
    asignadoA: string,
    token?: string,
  ) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('miembros_equipo')
      .select('usuario_id')
      .eq('equipo_id', equipoId)
      .eq('usuario_id', asignadoA)
      .single();

    if (error || !data) {
      throw new BadRequestException('El usuario no pertenece al equipo de esta actividad');
    }
  }

  private async validateOwnership(
    actividadId: string,
    userId: string,
    token?: string,
  ) {
    const actividad = await this.fetchActividad(actividadId, token);
    this.assertOwner(actividad, userId);
    return actividad;
  }

  private async validateWrite(
    actividadId: string,
    userId: string,
    asignadoA?: string,
    token?: string,
  ) {
    const actividad = await this.fetchActividad(actividadId, token);
    this.assertOwner(actividad, userId);

    if (!actividad.equipoId) {
      throw new BadRequestException('La actividad no tiene un equipo asignado');
    }

    if (asignadoA) {
      await this.assertTeamMember(actividad.equipoId, asignadoA, token);
    }

    return actividad;
  }

  async create(
    actividadId: string,
    dto: CreateSubtareaDto,
    userId: string,
    token?: string,
  ) {
    await this.validateWrite(actividadId, userId, dto.asignado_a, token);

    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('subtareas')
      .insert({
        actividad_id: actividadId,
        nombre: dto.nombre,
        asignado_a: dto.asignado_a ?? null,
        horas_estimadas: dto.horas_estimadas ?? null,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findAll(actividadId: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('subtareas')
      .select('*')
      .eq('actividad_id', actividadId);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(
    actividadId: string,
    subtareaId: string,
    dto: UpdateSubtareaDto,
    userId: string,
    token?: string,
  ) {
    if (dto.asignado_a !== undefined) {
      await this.validateWrite(actividadId, userId, dto.asignado_a, token);
    } else {
      await this.validateOwnership(actividadId, userId, token);
    }

    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('subtareas')
      .update(dto)
      .eq('id', subtareaId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async setCompletado(
    actividadId: string,
    subtareaId: string,
    completado: boolean,
    userId: string,
    token?: string,
  ) {
    await this.validateOwnership(actividadId, userId, token);

    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('subtareas')
      .update({ completado })
      .eq('id', subtareaId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async remove(
    actividadId: string,
    subtareaId: string,
    userId: string,
    token?: string,
  ) {
    await this.validateOwnership(actividadId, userId, token);

    const supabase = this.supabaseService.getClient(token);
    const { error } = await supabase
      .from('subtareas')
      .delete()
      .eq('id', subtareaId);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: `Subtarea ${subtareaId} eliminada exitosamente` };
  }
}
