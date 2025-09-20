import { IsNumber, IsString, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum RechargeOrderStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
}

export enum RechargeOrderSortField {
  ADD_TIME = 'add_time',
  AMOUNT = 'amount',
  PAID_TIME = 'paid_time',
}

export enum RechargeOrderSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class RechargeOrderQueryDto {
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
  @IsEnum(RechargeOrderStatus)
  status?: RechargeOrderStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(RechargeOrderSortField)
  sort_field?: RechargeOrderSortField = RechargeOrderSortField.ADD_TIME;

  @IsOptional()
  @IsEnum(RechargeOrderSortOrder)
  sort_order?: RechargeOrderSortOrder = RechargeOrderSortOrder.DESC;
}

export class CreateRechargeOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  setting_id?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0.01)
  amount?: number;
}

export class RechargePayDto {
  @IsNumber()
  order_id: number;

  @IsString()
  pay_type: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class CheckRechargeStatusDto {
  @IsNumber()
  order_id: number;
}