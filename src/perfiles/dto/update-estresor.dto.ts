import { IsNumber, Min, Max } from 'class-validator';

export class UpdateEstresorDto {
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(5)
  peso!: number;
}
