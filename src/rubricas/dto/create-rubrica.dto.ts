import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateRubricaDto {
    @IsString()
    @IsNotEmpty()
    materia_id!: string;

    @IsString()
    @IsNotEmpty()
    tipo_actividad!: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    porcentaje!: number;
}
