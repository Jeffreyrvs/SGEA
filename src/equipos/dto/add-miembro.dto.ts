import { IsEmail } from 'class-validator';

export class AddMiembroDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  email_miembro!: string;
}