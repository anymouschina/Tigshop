import { IsEnum, IsNumber, IsString, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export enum CouponType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
}

export class CreateCouponDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @Min(0)
  minAmount: number;

  @IsNumber()
  @Max(100)
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(CouponType)
  @IsOptional()
  type?: CouponType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @IsNumber()
  @Max(100)
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UseCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;
}

export class GetUserCouponsDto {
  @IsEnum(CouponStatus)
  @IsOptional()
  status?: CouponStatus;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  size?: number;
}

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsOptional()
  productIds?: number[];
}