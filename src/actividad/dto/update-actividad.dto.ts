import { PartialType } from '@nestjs/mapped-types';
import { CreateActividadDto } from './create-actividad.dto';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { StatusActividad } from '../enum/status.enum';

export class UpdateActividadDto extends PartialType(CreateActividadDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  materia_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  usuario_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tipo?: string;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  fecha_entrega?: Date;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  dificultad?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  puntaje_contenido?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  importancia?: string;

  @IsOptional()
  @IsEnum(StatusActividad)
  estatus?: StatusActividad;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  tiempo_estimado?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  equipoId?: string;

  //@IsOptional()
  //@IsDateString()
  //fechaCompletado?: Date;
}
