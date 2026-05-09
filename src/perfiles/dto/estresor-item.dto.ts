import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class EstresorItemDto {
  @IsInt()
  @Min(1)
  @Max(8)
  factor_id!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(5)
  peso!: number;
}
