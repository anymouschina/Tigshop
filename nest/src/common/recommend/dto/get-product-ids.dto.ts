import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductIdsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 10;
}