// @ts-nocheck
import { IsOptional, IsNumber, IsString, IsArray, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum CollectSortField {
  ADD_TIME = 'add_time',
  PRODUCT_PRICE = 'product_price',
  PRODUCT_NAME = 'product_name',
}

export enum CollectSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class CollectQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  category_id?: number;

  @IsOptional()
  @IsEnum(CollectSortField)
  sort_field?: CollectSortField = CollectSortField.ADD_TIME;

  @IsOptional()
  @IsEnum(CollectSortOrder)
  sort_order?: CollectSortOrder = CollectSortOrder.DESC;
}

export class CollectProductDto {
  @IsNumber()
  product_id: number;
}

export class CancelCollectDto {
  @IsNumber()
  product_id: number;
}

export class BatchCollectDto {
  @IsArray()
  @IsNumber({}, { each: true })
  product_ids: number[];
}

export class BatchCheckCollectDto {
  @IsArray()
  @IsNumber({}, { each: true })
  product_ids: number[];
}
