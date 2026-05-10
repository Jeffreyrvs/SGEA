import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { StatusActividad } from './enum/status.enum';

@Injectable()
export class ActividadService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async create(dto: CreateActividadDto, usuarioId?: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);

    const { data: rubrica, error: rubricaError } = await supabase
      .from('rubricas')
      .select('porcentaje')
      .eq('materia_id', dto.materia_id)
      .eq('tipo_actividad', dto.tipo)
      .single();

    if (rubricaError) throw new InternalServerErrorException(rubricaError.message);

    //const puntajeTotalMateria = rubrica.porcentaje;

    const { data, error } = await supabase
      .from('actividades')
      .insert({
        usuario_id: usuarioId || dto.usuario_id || null,
        materia_id: dto.materia_id,
        nombre: dto.nombre,
        tipo: dto.tipo,
        fecha_entrega: dto.fecha_entrega,
        dificultad: dto.dificultad ?? null,
        puntaje_contenido: dto.puntaje_contenido ?? null,
        importancia: rubrica?.porcentaje ?? dto.importancia ?? null,
        estatus: dto.estatus ?? StatusActividad.PENDIENTE,
        descripcion: dto.descripcion ?? null,
        tiempo_estimado: dto.tiempo_estimado ?? null,
        equipo_asignado: dto.equipo_asignado ?? null,
        //fechaCompletado: dto.fechaCompletado ?? null,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findAll(usuarioId: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('usuario_id', usuarioId);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findByMateria(id_materia: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('materia_id', id_materia);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findByUsuario(id_usuario: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('usuario_id', id_usuario);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(id: string, updateActividadDto: UpdateActividadDto, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('actividades')
      .update(updateActividadDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateStatus(id: string, nuevoEstado: StatusActividad, token?: string) {
    const actividad = await this.findOne(id);

    const camposAActualizar: any = {
      estatus: nuevoEstado,
    };

    if (nuevoEstado === StatusActividad.COMPLETADA) {
      camposAActualizar.fechaCompletado = new Date().toISOString();
    } else {
      camposAActualizar.fechaCompletado = null;
    }

    return await this.update(id, camposAActualizar, token);
  }

  async remove(id: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { error } = await supabase
      .from('actividades')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: `Actividad con ID ${id} eliminada exitosamente` };
  }
}
