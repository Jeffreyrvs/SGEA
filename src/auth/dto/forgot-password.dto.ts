import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  email: string;

  @IsOptional()
  @IsString()
  redirectTo?: string;
}
