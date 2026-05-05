import { Type } from 'class-transformer';
import { IsString, IsUUID, IsArray, ArrayMinSize, ValidateNested, IsEmail } from 'class-validator';

export class MiembroDto {
  @IsEmail({}, { message: 'El correo del integrante no es válido' })
  email_miembro!: string;
}

export class CreateEquipoDto {
  @IsUUID()
  materia_id!: string;

  @IsString()
  nombre!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El equipo debe tener al menos un integrante además del creador' })
  @ValidateNested({ each: true })
  @Type(() => MiembroDto)
  miembros!: MiembroDto[];
}