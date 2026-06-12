import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePerfilAcademicoDto } from './dto/create-perfil-academico.dto';
import { CreateEstresoresDto } from './dto/create-estresores.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { UpdateEstresorDto } from './dto/update-estresor.dto';

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

  async updateEstresor(usuarioId: string, dto: UpdateEstresorDto, factor_id: number) {
    const supabase = this.supabaseService.getClient();
    const ahora = new Date().toISOString();

    const registro = {
      usuario_id: usuarioId,
      factor_id: factor_id,
      peso: dto.peso,
      fecha_actualizacion: ahora,
    };
    const { data, error } = await supabase
      .from('estresores')
      .upsert(registro, { onConflict: 'usuario_id,factor_id' })
      .select('usuario_id, factor_id, peso, fecha_actualizacion');

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async obtenerEstresor(usuarioId: string, factor_id: number) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('estresores')
      .select('usuario_id, factor_id, peso, fecha_actualizacion')
      .eq('usuario_id', usuarioId)
      .eq('factor_id',factor_id);

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

    if (denominador < 0.1) return { sin_datos: true };

    const valor = Math.round((numerador / denominador) * 20 * 10) / 10;
    const categoria = valor < 34 ? 'Bajo' : valor < 67 ? 'Medio' : 'Alto';

    // Guardar captura una vez al día máximo
    const hoy = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

    const { data: capturaExistente } = await supabase
      .from('capturas_estres')
      .select('id')
      .eq('usuario_id', usuarioId)
      .gte('fecha_captura', `${hoy}T00:00:00`)
      .lte('fecha_captura', `${hoy}T23:59:59`)
      .maybeSingle();

    if (!capturaExistente) {
      // Obtener distribución de factores para guardar en JSON
      const factores = rows.reduce((acc, row) => {
        acc[`factor_${row.factor_id}`] = row.peso;
        return acc;
      }, {} as Record<string, number>);

      await supabase
        .from('capturas_estres')
        .insert({
          usuario_id: usuarioId,
          ne_valor: valor,
          fecha_captura: new Date().toISOString(),
          factor: factores,
        });
    }

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

  async getAvatar(usuarioId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('avatar_url')
      .eq('usuario_id', usuarioId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      usuario_id: usuarioId,
      avatar_url: data.avatar_url ?? null,
    };
  }

}
