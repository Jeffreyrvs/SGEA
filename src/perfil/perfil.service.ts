import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@Injectable()
export class PerfilService {
    constructor(private readonly supabaseService: SupabaseService){}

    async getPerfil(userId: string) {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('perfil_usuario')
            .select('*')
            .eq('usuario_id', userId)
            .single();

        if (error || !data) {
            throw new NotFoundException('Perfil NO encontrado');
        }

        return data;
    }

    async updatePerfil(userId: string, dto: UpdatePerfilDto) {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('perfil_usuario')
            .update(dto)
            .eq('usuario_id', userId)
            .select()
            .single();

        if (error) {
            throw new InternalServerErrorException('Error al actualizar perfil');
        }

        return data;
    }

    async uploadAvatar(userId: string, file: Express.Multer.File) {
        const supabase = this.supabaseService.getClient();

        // Nombre único para evitar colisiones: userId/timestamp.ext
        const extension = file.mimetype.split('/')[1];
        const fileName = `${userId}/${Date.now()}.${extension}`;

        // Subir archivo a Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('avatares')
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true, // sobreescribe si ya existe
            });

        if (uploadError) {
            throw new InternalServerErrorException('Error al subir la imagen');
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('avatares')
            .getPublicUrl(fileName);

        const avatarUrl = urlData.publicUrl;

        // Guardar URL en perfil_usuario
        const { error: updateError } = await supabase
            .from('perfil_usuario')
            .update({ avatar_url: avatarUrl })
            .eq('usuario_id', userId);

        if (updateError) {
            throw new InternalServerErrorException('Error al actualizar el avatar en el perfil');
        }

        return { avatar_url: avatarUrl };
    }

}
