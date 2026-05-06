import { IsNotEmpty, IsString, IsDateString, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { StatusActividad } from '../enum/status.enum';

export class CreateActividadDto {
    @IsNotEmpty()
    @IsString()
    materia_id!: string;

    @IsOptional()
    @IsString()
    usuario_id?: string;

    @IsNotEmpty()
    @IsString()
    nombre!: string;

    @IsNotEmpty()
    @IsString()
    tipo!: string;

    @IsNotEmpty()
    @IsString()
    materia!: string;

    @IsNotEmpty()
    @IsDateString()
    fecha_entrega!: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    nivel_dificultad?: number;

    @IsOptional()
    @IsString()
    calificacion_contenido?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsNumber()
    tiempo_estimado?: number;

    @IsOptional()
    @IsString()
    equipo_asignado?: string;

    @IsOptional()
    @IsEnum(StatusActividad)
    status?: StatusActividad;

    @IsOptional()
    @IsDateString()
    fechaCompletado?: Date;
}











