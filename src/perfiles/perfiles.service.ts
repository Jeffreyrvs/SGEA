import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePerfilAcademicoDto } from './dto/create-perfil-academico.dto';
import { CreateEstresoresDto } from './dto/create-estresores.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@Injectable()
export class PerfilesService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async crearOActualizar(usuarioId: string, dto: CreatePerfilAcademicoDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('perfil_usuario')
      .upsert(
        {
          usuario_id: usuarioId,
          institucion: dto.institucion,
          carrera: dto.carrera,
          semestre: dto.semestre,
          promedio_general: dto.promedio_general,
        },
        { onConflict: 'usuario_id' },
      )
      .select('usuario_id, institucion, carrera, semestre, promedio_general')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async obtenerPorUsuario(usuarioId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('usuario_id, institucion, carrera, semestre, promedio_general')
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Perfil académico no encontrado');
      }
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async guardarEstresores(usuarioId: string, dto: CreateEstresoresDto) {
    const supabase = this.supabaseService.getClient();
    const ahora = new Date().toISOString();

    const registros = dto.factores.map((f) => ({
      usuario_id: usuarioId,
      factor_id: f.factor_id,
      peso: f.peso,
      fecha_actualizacion: ahora,
    }));

    const { data, error } = await supabase
      .from('estresores')
      .upsert(registros, { onConflict: 'usuario_id,factor_id' })
      .select('usuario_id, factor_id, peso, fecha_actualizacion');

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async obtenerEstresores(usuarioId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('estresores')
      .select('usuario_id, factor_id, peso, fecha_actualizacion')
      .eq('usuario_id', usuarioId)
      .order('factor_id', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getPerfil(usuarioId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (error) throw new NotFoundException('Perfil no encontrado');
    return data;
  }

  async updatePerfil(usuarioId: string, dto: UpdatePerfilDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('perfil_usuario')
      .update(dto)
      .eq('usuario_id', usuarioId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException('Error al actualizar el perfil');
    return data;
  }

  private readonly PESOS_REALES: Record<number, number> = {
    1: 0.143, 2: 0.151, 3: 0.152, 4: 0.063,
    5: 0.132, 6: 0.118, 7: 0.106, 8: 0.134,
  };

  async calcularNivelEstres(usuarioId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('estresores')
      .select('factor_id, peso')
      .eq('usuario_id', usuarioId);

    if (error) throw new InternalServerErrorException(error.message);

    const rows = data as { factor_id: number; peso: number }[];
    let numerador = 0;
    let denominador = 0;

    for (const row of rows) {
      const pr = this.PESOS_REALES[row.factor_id];
      if (pr !== undefined) {
        numerador += row.peso * pr;
        denominador += pr;
      }
    }

    if (denominador < 0.5) return { sin_datos: true };

    const valor = Math.round((numerador / denominador) * 20 * 10) / 10;
    const categoria = valor < 34 ? 'Bajo' : valor < 67 ? 'Medio' : 'Alto';
    return { valor, categoria, sin_datos: false };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const supabase = this.supabaseService.getClient();

    const extension = file.mimetype.split('/')[1];
    const fileName = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('avatares')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) throw new InternalServerErrorException('Error al subir la imagen');

    const { data: urlData } = supabase.storage
      .from('avatares')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('perfil_usuario')
      .update({ avatar_url: urlData.publicUrl })
      .eq('usuario_id', userId);

    if (updateError) throw new InternalServerErrorException('Error al actualizar el avatar');

    return { avatar_url: urlData.publicUrl };
  }

}
