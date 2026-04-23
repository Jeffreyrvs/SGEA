import { IsInt, Min, Max } from 'class-validator';

export class EstresorItemDto {
  @IsInt()
  @Min(1)
  @Max(8)
  factor_id: number;

  @IsInt()
  @Min(1)
  @Max(5)
  peso: number;
}
