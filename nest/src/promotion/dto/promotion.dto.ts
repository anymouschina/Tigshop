// @ts-nocheck
import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum PromotionType {
  DISCOUNT = 'discount',
  REDUCE = 'reduce',
  GIFT = 'gift',
  SHIPPING = 'shipping',
}

export enum TimeType {
  FIXED = 1,
  RELATIVE = 2,
  PERMANENT = 3,
}

export class PromotionQueryDto {
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
  @IsEnum(TimeType)
  time_type?: TimeType;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  sort_field?: string = 'promotion_id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreatePromotionDto {
  @IsString()
  promotion_name: string;

  @IsString()
  @IsOptional()
  promotion_desc?: string;

  @IsEnum(PromotionType)
  promotion_type: PromotionType;

  @IsEnum(TimeType)
  time_type: TimeType;

  @IsString()
  @IsOptional()
  start_time?: string;

  @IsString()
  @IsOptional()
  end_time?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delay_day?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  use_day?: number = 0;

  @IsNumber()
  @Min(0)
  min_order_amount: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount_value?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reduce_amount?: number;

  @IsBoolean()
  is_show: boolean = true;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sort_order?: number = 0;

  @IsString()
  @IsOptional()
  rules?: string;

  @IsNumber()
  shop_id: number;
}

export class UpdatePromotionDto extends CreatePromotionDto {
  @IsNumber()
  promotion_id: number;
}

export class PromotionUpdateFieldDto {
  @IsNumber()
  id: number;

  @IsString()
  field: string;

  value: any;
}
