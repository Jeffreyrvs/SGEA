import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateRubricaDto } from './dto/create-rubrica.dto';
import { UpdateRubricaDto } from './dto/update-rubrica.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RubricasService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async create(dto: CreateRubricaDto, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('rubricas')
      .insert({
        materia_id: dto.materia_id,
        tipo_actividad: dto.tipo_actividad,
        porcentaje: dto.porcentaje,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findAll() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('rubricas')
      .select('*');

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('rubricas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Rubrica con ID ${id} no encontrada`);
      }
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async update(id: string, updateRubricaDto: UpdateRubricaDto, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('rubricas')
      .update(updateRubricaDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async remove(id: string, token?: string) {
    const supabase = this.supabaseService.getClient(token);
    const { error } = await supabase
      .from('rubricas')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: `Rubrica con ID ${id} eliminada exitosamente` };
  }
}
