import { IsNotEmpty, IsString, IsDateString, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { StatusActividad } from '../enum/status.enum';

export class CreateActividadDto {
    @IsNotEmpty()
    @IsString()
    materia_id!: string;

    @IsNotEmpty()
    @IsString()
    usuario_id!: string;

    @IsNotEmpty()
    @IsString()
    nombre!: string;

    @IsNotEmpty()
    @IsString()
    tipo!: string;

    @IsNotEmpty()
    @IsDateString()
    fecha_entrega!: Date;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    dificultad?: number;

    @IsOptional()
    @IsString()
    puntaje_contenido?: string;

    @IsOptional()
    @IsString()
    importancia?: string;

    @IsOptional()
    @IsEnum(StatusActividad)
    estatus?: StatusActividad;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsNumber()
    tiempo_estimado?: number;


    @IsOptional()
    @IsString()
    equipoId?: string;

    @IsOptional()
    @IsDateString()
    fechaCompletado?: Date;
}












