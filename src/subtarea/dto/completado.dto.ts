import { IsBoolean } from 'class-validator';

export class CompletadoDto {
  @IsBoolean()
  completado!: boolean;
}
