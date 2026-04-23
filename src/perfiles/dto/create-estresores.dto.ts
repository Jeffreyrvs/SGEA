import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { EstresorItemDto } from './estresor-item.dto';

export class CreateEstresoresDto {
  @IsArray()
  @ArrayMinSize(8)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => EstresorItemDto)
  factores: EstresorItemDto[];
}
