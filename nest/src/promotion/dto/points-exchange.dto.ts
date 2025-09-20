// @ts-nocheck
import { IsOptional, IsString, IsNumber, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PointsExchangeQueryDto {
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
  @Type(() => Number)
  @IsNumber()
  is_enabled?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  is_hot?: number = -1;
}

export class PointsExchangeDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreatePointsExchangeDto {
  @IsNumber()
  @Type(() => Number)
  product_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  exchange_integral: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  points_deducted_amount?: number = 0;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_hot?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_enabled?: boolean = true;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sku_id?: number = 0;
}

export class UpdatePointsExchangeDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  exchange_integral?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  points_deducted_amount?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_hot?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sku_id?: number;
}

export class UpdatePointsExchangeFieldDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeletePointsExchangeDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeletePointsExchangeDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
