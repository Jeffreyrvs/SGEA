import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdatePerfilDto {

    @IsOptional()
    @IsString()
    usuario?: string;

    @IsOptional()
    @IsString()
    institucion?: string;

    @IsOptional()
    @IsString()
    carrera?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    semestre?: number;

    @IsOptional()
    @IsString()
    avatar_url?: string;
    
}