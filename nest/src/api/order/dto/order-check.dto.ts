// @ts-nocheck
import {
  IsOptional,
  IsNumber,
  IsArray,
  IsString,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class OrderCheckDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flow_type?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  address_id?: number;

  @IsOptional()
  @IsArray()
  shipping_type?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pay_type_id?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  use_point?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  use_balance?: number = 0;

  @IsOptional()
  @IsArray()
  use_coupon_ids?: number[];

  @IsOptional()
  @IsArray()
  select_user_coupon_ids?: number[];
}

export class OrderUpdateDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  address_id?: number;

  @IsOptional()
  @IsArray()
  shipping_type?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pay_type_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  use_point?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  use_balance?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class OrderSubmitDto {
  @IsNumber()
  address_id: number;

  @IsArray()
  cart_ids: number[];

  @IsNumber()
  @Min(0)
  total_amount: number;

  @IsNumber()
  @Min(0)
  shipping_fee: number = 0;

  @IsNumber()
  @Min(0)
  pay_amount: number;

  @IsNumber()
  pay_type_id: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsArray()
  coupon_ids?: number[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  use_point?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  use_balance?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flow_type?: number = 1;

  @IsOptional()
  @IsArray()
  product_extra?: any[];
}
