import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { AddMiembroDto } from './dto/add-miembro.dto';

@Injectable()
export class EquiposService {
    constructor(private readonly supabaseService: SupabaseService) {}

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

}
