import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSubtareaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsUUID()
  asignado_a?: string;

  @IsOptional()
  @IsNumber()
  horas_estimadas?: number;
}
