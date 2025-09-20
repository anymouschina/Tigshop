// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsArray,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum CouponType {
  MONEY = 1,
  DISCOUNT = 2,
}

export enum SendType {
  USER_GET = 1,
  SYSTEM_SEND = 2,
  REGISTER_SEND = 3,
}

export enum ReduceType {
  MONEY = 1,
  DISCOUNT = 2,
}

export class CouponQueryDto {
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
  keyword?: string;

  @IsOptional()
  @IsString()
  sort_field?: string = "coupon_id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";
}

export class CreateCouponDto {
  @IsString()
  coupon_name: string;

  @IsString()
  @IsOptional()
  coupon_desc?: string;

  @IsEnum(CouponType)
  coupon_type: CouponType;

  @IsNumber()
  @Min(0)
  coupon_money?: number;

  @IsNumber()
  @Min(0)
  coupon_discount?: number;

  @IsNumber()
  @Min(0)
  min_order_amount: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  max_order_amount?: number;

  @IsString()
  @IsOptional()
  send_range: string = "";

  @IsString()
  @IsOptional()
  send_range_data: string = "";

  @IsBoolean()
  is_global: boolean = true;

  @IsBoolean()
  is_new_user: boolean = false;

  @IsBoolean()
  is_show: boolean = true;

  @IsBoolean()
  enabled_click_get: boolean = true;

  @IsString()
  @IsOptional()
  limit_user_rank: string = "";

  @IsString()
  @IsOptional()
  use_start_date?: string;

  @IsString()
  @IsOptional()
  use_end_date?: string;

  @IsEnum(SendType)
  send_type: SendType = SendType.USER_GET;

  @IsNumber()
  @Min(0)
  delay_day: number = 0;

  @IsNumber()
  @Min(0)
  use_day: number = 0;

  @IsNumber()
  @Min(1)
  send_num: number = 1;

  @IsNumber()
  coupon_unit: number = 1;

  @IsNumber()
  @Min(0)
  limit_num: number = 0;

  @IsEnum(ReduceType)
  reduce_type: ReduceType = ReduceType.MONEY;

  @IsNumber()
  shop_id: number;
}

export class UpdateCouponDto extends CreateCouponDto {
  @IsNumber()
  coupon_id: number;
}

export class CouponUpdateFieldDto {
  @IsNumber()
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class CouponBatchDto {
  @IsArray()
  ids: number[];

  @IsString()
  type: string;
}
