import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ConfigQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 15;

  @IsOptional()
  @IsString()
  sort_field?: string = 'id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  biz_code?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  paging?: boolean = true;
}

export class ConfigDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateConfigDto {
  @IsString()
  biz_code: string;

  @IsString()
  biz_val: string;
}

export class UpdateConfigDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  biz_code?: string;

  @IsOptional()
  @IsString()
  biz_val?: string;
}

export class UpdateConfigFieldDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteConfigDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteConfigDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class BatchUpdateConfigDto {
  @IsArray()
  configs: Array<{
    id: number;
    biz_val: string;
  }>;
}