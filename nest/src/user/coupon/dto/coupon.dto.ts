import { IsNotEmpty, IsInt, IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CouponStatus {
  AVAILABLE = 'available',
  USED = 'used',
  EXPIRED = 'expired',
}

export enum CouponType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

export class UserCouponListDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsInt({ message: '页码必须为整数' })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 15 })
  @IsOptional()
  @IsInt({ message: '每页数量必须为整数' })
  @Type(() => Number)
  size?: number = 15;

  @ApiProperty({ description: '排序字段', required: false, default: 'start_date' })
  @IsOptional()
  @IsString({ message: '排序字段格式不正确' })
  sort_field?: string = 'start_date';

  @ApiProperty({ description: '排序方式', required: false, default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方式不正确' })
  sort_order?: 'asc' | 'desc' = 'asc';

  @ApiProperty({ description: '优惠券状态', required: false, enum: CouponStatus })
  @IsOptional()
  @IsEnum(CouponStatus, { message: '优惠券状态不正确' })
  status?: CouponStatus;
}

export class AvailableCouponListDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsInt({ message: '页码必须为整数' })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 15 })
  @IsOptional()
  @IsInt({ message: '每页数量必须为整数' })
  @Type(() => Number)
  size?: number = 15;

  @ApiProperty({ description: '排序字段', required: false, default: 'add_time' })
  @IsOptional()
  @IsString({ message: '排序字段格式不正确' })
  sort_field?: string = 'add_time';

  @ApiProperty({ description: '排序方式', required: false, default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方式不正确' })
  sort_order?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: '店铺ID', required: false, default: -1 })
  @IsOptional()
  @IsInt({ message: '店铺ID必须为整数' })
  @Type(() => Number)
  shop_id?: number = -1;
}

export class ClaimCouponDto {
  @ApiProperty({ description: '优惠券ID' })
  @IsNotEmpty({ message: '优惠券ID不能为空' })
  @IsInt({ message: '优惠券ID必须为整数' })
  @Type(() => Number)
  coupon_id: number;
}

export class DeleteCouponDto {
  @ApiProperty({ description: '用户优惠券ID' })
  @IsNotEmpty({ message: '用户优惠券ID不能为空' })
  @IsInt({ message: '用户优惠券ID必须为整数' })
  @Type(() => Number)
  id: number;
}

export class CouponDetailDto {
  @ApiProperty({ description: '优惠券ID' })
  @IsNotEmpty({ message: '优惠券ID不能为空' })
  @IsInt({ message: '优惠券ID必须为整数' })
  @Type(() => Number)
  id: number;
}

export class ValidateCouponDto {
  @ApiProperty({ description: '优惠券代码' })
  @IsNotEmpty({ message: '优惠券代码不能为空' })
  @IsString({ message: '优惠券代码格式不正确' })
  code: string;

  @ApiProperty({ description: '订单金额' })
  @IsNotEmpty({ message: '订单金额不能为空' })
  @IsNumber({}, { message: '订单金额必须为数字' })
  @Min(0, { message: '订单金额不能为负数' })
  @Type(() => Number)
  orderAmount: number;
}

export class UseCouponDto {
  @ApiProperty({ description: '优惠券代码' })
  @IsNotEmpty({ message: '优惠券代码不能为空' })
  @IsString({ message: '优惠券代码格式不正确' })
  code: string;

  @ApiProperty({ description: '订单金额' })
  @IsNotEmpty({ message: '订单金额不能为空' })
  @IsNumber({}, { message: '订单金额必须为数字' })
  @Min(0, { message: '订单金额不能为负数' })
  @Type(() => Number)
  orderAmount: number;
}

export class CouponListResponse {
  @ApiProperty({ description: '优惠券列表' })
  records: any[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

export class CouponResponse {
  @ApiProperty({ description: '优惠券详情' })
  coupon: any;

  @ApiProperty({ description: '消息' })
  message?: string;
}

export class CouponValidationResponse {
  @ApiProperty({ description: '是否有效' })
  isValid: boolean;

  @ApiProperty({ description: '折扣金额' })
  discountAmount: number;

  @ApiProperty({ description: '消息' })
  message: string;

  @ApiProperty({ description: '优惠券信息', required: false })
  coupon?: any;
}

export class SuccessResponse {
  @ApiProperty({ description: '消息' })
  message?: string;

  @ApiProperty({ description: '优惠券ID', required: false })
  coupon_id?: number;
}