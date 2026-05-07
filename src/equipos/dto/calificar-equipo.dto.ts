import { IsInt, Min, Max } from 'class-validator';

export class CalificarEquipoDto {
  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  satisfaccion!: number;
}