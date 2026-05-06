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
  @IsString()
  @IsNotEmpty()
  materia?: string;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  fecha_entrega?: string;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  nivel_dificultad?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  calificacion_contenido?: string;

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
  equipo_asignado?: string;

  @IsOptional()
  @IsEnum(StatusActividad)
  status?: StatusActividad;

  @IsOptional()
  @IsDateString()
  fechaCompletado?: Date;



}
