// @ts-nocheck
import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class CouponQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 10;

  @IsOptional()
  @IsEnum(['all', 'unused', 'used', 'expired'])
  status?: string = 'all';

  @IsOptional()
  @IsEnum(['all', 'system', 'user', 'activity'])
  coupon_type?: string = 'all';

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  sort_field?: string = 'add_time';

  @IsOptional()
  @IsString()
  sort_order?: string = 'desc';
}

export class ReceiveCouponDto {
  @IsNumber()
  coupon_id: number;
}

export class CouponBatchDto {
  @IsArray()
  @ArrayNotEmpty()
  coupon_ids: number[];
}
