import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { AddMiembroDto } from './dto/add-miembro.dto';
import { CalificarEquipoDto } from './dto/calificar-equipo.dto';
import { PerfilesService } from '../perfiles/perfiles.service';

@Injectable()
export class EquiposService {
    constructor(private readonly supabaseService: SupabaseService, private readonly perfilesService: PerfilesService,) {}

    async crearEquipo(usuarioId: string, dto: CreateEquipoDto, accessToken: string) {
        const supabase = this.supabaseService.getClient(); // para operaciones admin
        const supabaseUser = this.supabaseService.getAuthenticatedClient(accessToken); // para inserts con RLS

        const [{ data: creadorData }, { data: usuarios, error: usuariosError }] = await Promise.all([
            supabase.auth.admin.getUserById(usuarioId),
            supabase.auth.admin.listUsers(),
        ]);

        if (usuariosError) {
            throw new InternalServerErrorException('Error al verificar los integrantes');
        }

        // Verificar que todos los correos existen en el sistema
        const correosRegistrados = usuarios.users.map(u => u.email);
        const correosInvalidos = dto.miembros
            .map(m => m.email_miembro)
            .filter(email => !correosRegistrados.includes(email));

        if (correosInvalidos.length > 0) {
            throw new BadRequestException(
            `Los siguientes correos no están registrados: ${correosInvalidos.join(', ')}`
            );
        }

        // Crear equipo con cliente autenticado (respeta RLS)
        const { data: equipo, error: equipoError } = await supabaseUser
            .from('equipos')
            .insert({
            materia_id: dto.materia_id,
            creador_id: usuarioId,
            nombre: dto.nombre,
            })
            .select()
            .single();

        if (equipoError) {
            throw new InternalServerErrorException('Error al crear el equipo');
        }

        // Construir miembros incluyendo al creador
        const miembros = dto.miembros.map(m => {
            const usuarioEncontrado = (usuarios.users as any[]).find(u => u.email === m.email_miembro);
            return {
            equipo_id: equipo.id,
            usuario_id: usuarioEncontrado.id,
            nombre_miembro: usuarioEncontrado.user_metadata?.display_name ?? m.email_miembro,
            email_miembro: m.email_miembro,
            };
        });

        miembros.unshift({
            equipo_id: equipo.id,
            usuario_id: usuarioId,
            nombre_miembro: creadorData.user?.user_metadata?.display_name ?? creadorData.user?.email ?? 'Sin nombre',
            email_miembro: creadorData.user?.email ?? '',
        });

        // Insertar miembros con cliente autenticado (RLS valida unicidad por materia)
        const { error: miembrosError } = await supabaseUser
            .from('miembros_equipo')
            .insert(miembros);

        if (miembrosError) {
            console.error('Miembros error:', miembrosError);
            await supabase.from('equipos').delete().eq('id', equipo.id);

            if (miembrosError.code === '42501' || miembrosError.message.includes('row-level security')) {
                throw new BadRequestException(
                'Uno o más integrantes ya pertenecen a un equipo en esta materia'
                );
            }

            throw new InternalServerErrorException('Error al agregar integrantes al equipo');
        }

        return {
            message: 'Equipo creado exitosamente',
            equipo: {
            id: equipo.id,
            nombre: equipo.nombre,
            materia_id: equipo.materia_id,
            miembros,
            },
        };
    }

    async getEquiposPorMateria(materiaId: string, accessToken: string) {
        const supabaseUser = this.supabaseService.getAuthenticatedClient(accessToken);

        const { data, error } = await supabaseUser
            .from('equipos')
            .select(`
            id,
            nombre,
            creador_id,
            materias (
                nombre
            ),
            miembros_equipo (
                nombre_miembro,
                email_miembro,
                usuario_id
            )
            `)
            .eq('materia_id', materiaId);
        
        console.log('materiaId:', materiaId);
        console.log('data:', data);
        console.log('error:', error);

        if (error) {
            throw new InternalServerErrorException('Error al obtener los equipos');
        }

        return data;
    }

    async addMiembro(equipoId: string, dto: AddMiembroDto, accessToken: string) {
        const supabase = this.supabaseService.getClient();
        const supabaseUser = this.supabaseService.getAuthenticatedClient(accessToken);

        // Verificar que el correo existe en el sistema
        const { data: usuarios } = await supabase.auth.admin.listUsers();
        const usuarioEncontrado = (usuarios.users as any[]).find(u => u.email === dto.email_miembro);

        if (!usuarioEncontrado) {
            throw new BadRequestException('El correo no está registrado en el sistema');
        }

        // Obtener la materia del equipo
        const { data: equipo, error: equipoError } = await supabaseUser
            .from('equipos')
            .select('id, materia_id')
            .eq('id', equipoId)
            .single();

        if (equipoError || !equipo) {
            throw new BadRequestException('Equipo no encontrado o no tienes acceso');
        }

        // Insertar nuevo miembro (RLS valida que no esté ya en un equipo de esa materia)
        const { error: miembroError } = await supabaseUser
            .from('miembros_equipo')
            .insert({
            equipo_id: equipoId,
            usuario_id: usuarioEncontrado.id,
            nombre_miembro: usuarioEncontrado.user_metadata?.display_name ?? dto.email_miembro,
            email_miembro: dto.email_miembro,
            });

        if (miembroError) {
            if (miembroError.code === '42501' || miembroError.message.includes('row-level security')) {
            throw new BadRequestException('El integrante ya pertenece a un equipo en esta materia');
            }
            throw new InternalServerErrorException('Error al agregar el integrante');
        }

        return {
            message: 'Integrante agregado exitosamente',
            miembro: {
            usuario_id: usuarioEncontrado.id,
            nombre_miembro: usuarioEncontrado.user_metadata?.display_name ?? dto.email_miembro,
            email_miembro: dto.email_miembro,
            },
        };
    }

    async calificarEquipo(equipoId: string, usuarioId: string, dto: CalificarEquipoDto, accessToken: string) {
        const supabase = this.supabaseService.getClient();
        const supabaseUser = this.supabaseService.getAuthenticatedClient(accessToken);

        // Verificar que el usuario es miembro del equipo
        const { data: esMiembro } = await supabaseUser
            .from('miembros_equipo')
            .select('usuario_id')
            .eq('equipo_id', equipoId)
            .eq('usuario_id', usuarioId)
            .maybeSingle();

        if (!esMiembro) {
            throw new BadRequestException('Solo los miembros del equipo pueden calificarlo');
        }

        // Upsert calificación
        const { error } = await supabase
            .from('calificaciones_equipo')
            .upsert({
            equipo_id: equipoId,
            calificador_id: usuarioId,
            satisfaccion: dto.satisfaccion,
            fecha_calificacion: new Date().toISOString(),
            }, { onConflict: 'equipo_id,calificador_id' });

        if (error) {
            throw new InternalServerErrorException('Error al guardar la calificación');
        }

        // Actualizar estresor clima social (factor_id = 5)
        const FACTOR_CLIMA_SOCIAL = 5;

        // Verificar si el usuario ya tiene el estresor clima social
        const { data: estresorExistente } = await supabase
            .from('estresores')
            .select('peso')
            .eq('usuario_id', usuarioId)
            .eq('factor_id', FACTOR_CLIMA_SOCIAL)
            .maybeSingle();

        // Obtener todos los equipos donde el usuario es miembro
        const { data: equiposDelUsuario } = await supabase
            .from('miembros_equipo')
            .select('equipo_id')
            .eq('usuario_id', usuarioId);

        const equipoIds = equiposDelUsuario?.map(e => e.equipo_id) ?? [];

        // Obtener calificacion_promedio de todos esos equipos
        const { data: equipos } = await supabase
            .from('equipos')
            .select('calificacion_promedio')
            .in('id', equipoIds)
            .not('calificacion_promedio', 'is', null);

        // Calcular promedio de todos los equipos
        const promedioTodosEquipos = equipos && equipos.length > 0
            ? equipos.reduce((sum, e) => sum + Number(e.calificacion_promedio), 0) / equipos.length
            : dto.satisfaccion;

        // Calcular nuevo peso del estresor clima social
        let nuevoPeso: number;
        if (estresorExistente) {
            nuevoPeso = Math.round((estresorExistente.peso + (6 - promedioTodosEquipos)) / 2);
        } else {
            nuevoPeso = Math.round(6 - promedioTodosEquipos);
        }

        // Upsert estresor clima social
        await supabase
            .from('estresores')
            .upsert({
            usuario_id: usuarioId,
            factor_id: FACTOR_CLIMA_SOCIAL,
            peso: nuevoPeso,
            fecha_actualizacion: new Date().toISOString(),
            }, { onConflict: 'usuario_id,factor_id' });

        // Obtener promedio del equipo actual
        const { data: equipo } = await supabase
            .from('equipos')
            .select('calificacion_promedio')
            .eq('id', equipoId)
            .single();

        return {
            message: 'Calificación guardada exitosamente',
            equipo_id: equipoId,
            promedio: equipo?.calificacion_promedio ?? null,
        };
    }

    async getCalificacion(equipoId: string, accessToken: string) {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('equipos')
            .select('id, nombre, calificacion_promedio')
            .eq('id', equipoId)
            .single();

        if (error) {
            throw new InternalServerErrorException('Error al obtener la calificación');
        }

        return {
            equipo_id: equipoId,
            promedio: data.calificacion_promedio ?? null,
            mensaje: data.calificacion_promedio ? undefined : 'Nadie ha calificado este equipo aún',
        };
    }

    async removeMiembro(equipoId: string, usuarioIdAEliminar: string, usuarioId: string, accessToken: string) {
        const supabase = this.supabaseService.getClient();
        const supabaseUser = this.supabaseService.getAuthenticatedClient(accessToken);

        // Verificar que el usuario es el creador del equipo
        const { data: equipo } = await supabaseUser
            .from('equipos')
            .select('creador_id')
            .eq('id', equipoId)
            .single();

        if (!equipo) {
            throw new BadRequestException('Equipo no encontrado');
        }

        if (equipo.creador_id !== usuarioId) {
            throw new BadRequestException('Solo el creador del equipo puede eliminar integrantes');
        }

        // No permitir que el creador se elimine a sí mismo
        if (usuarioIdAEliminar === usuarioId) {
            throw new BadRequestException('El creador no puede eliminarse a sí mismo del equipo');
        }

        // Eliminar miembro
        const { error } = await supabase
            .from('miembros_equipo')
            .delete()
            .eq('equipo_id', equipoId)
            .eq('usuario_id', usuarioIdAEliminar);

        if (error) {
            throw new InternalServerErrorException('Error al eliminar el integrante');
        }

        return {
            message: 'Integrante eliminado exitosamente',
        };
    }

    async getMisEquipos(usuarioId: string, accessToken: string) {
        const supabaseUser = this.supabaseService.getAuthenticatedClient(accessToken);

        const { data, error } = await supabaseUser
            .from('miembros_equipo')
            .select(`
            equipo_id,
            equipos (
                id,
                nombre,
                materia_id,
                creador_id,
                calificacion_promedio,
                miembros_equipo (
                nombre_miembro,
                email_miembro,
                usuario_id
                )
            )
            `)
            .eq('usuario_id', usuarioId);

        if (error) {
            throw new InternalServerErrorException('Error al obtener los equipos');
        }

        return data?.map(d => d.equipos) ?? [];
    }

    async getNivelEstresEquipo(equipoId: string, accessToken: string) {
        const supabase = this.supabaseService.getClient();
        const supabaseUser = this.supabaseService.getAuthenticatedClient(accessToken);

        // Obtener miembros del equipo
        const { data: miembros, error } = await supabaseUser
            .from('miembros_equipo')
            .select('usuario_id, nombre_miembro, email_miembro')
            .eq('equipo_id', equipoId);

        if (error || !miembros) {
            throw new InternalServerErrorException('Error al obtener los miembros del equipo');
        }

        // Calcular NE individual de cada miembro
        const resultados = await Promise.all(
            miembros.map(async (miembro) => {
            // Miembro sin cuenta en SGEA
            if (!miembro.usuario_id) {
                return {
                nombre_miembro: miembro.nombre_miembro,
                email_miembro: miembro.email_miembro,
                ne: 'No disponible',
                };
            }

            const ne = await this.perfilesService.calcularNivelEstres(miembro.usuario_id);

            return {
                nombre_miembro: miembro.nombre_miembro,
                email_miembro: miembro.email_miembro,
                ne: ne.sin_datos ? 'Sin datos' : { valor: ne.valor, categoria: ne.categoria },
            };
            })
        );

        // Calcular promedio solo con miembros que tienen NE calculado
        const neValidos = resultados
            .filter(r => typeof r.ne === 'object' && r.ne !== null && 'valor' in r.ne)
            .map(r => (r.ne as { valor: number; categoria: string }).valor);

        const promedioEquipo = neValidos.length > 0
            ? Math.round(neValidos.reduce((sum, ne) => sum + ne, 0) / neValidos.length * 10) / 10
            : null;

        const categoriaEquipo = promedioEquipo === null
            ? 'Sin datos'
            : promedioEquipo < 34 ? 'Bajo' : promedioEquipo < 67 ? 'Medio' : 'Alto';

        return {
            equipo_id: equipoId,
            ne_equipo: promedioEquipo,
            categoria_equipo: categoriaEquipo,
            miembros: resultados,
        };
    }

}
