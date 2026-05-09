import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubtareaDto {
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsUUID()
  asignado_a?: string;

  @IsOptional()
  @IsNumber()
  horas_estimadas?: number;
}
