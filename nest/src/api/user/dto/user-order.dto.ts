// @ts-nocheck
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum OrderStatus {
  CLOSED = 0,
  PENDING_PAYMENT = 1,
  PENDING_DELIVERY = 2,
  PENDING_RECEIPT = 3,
  COMPLETED = 4,
  REFUNDED = 5,
  CANCELLED = 6,
  CANCELLED_USER = 7,
}

export class UserOrderQueryDto {
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
  @IsEnum(OrderStatus)
  order_status?: OrderStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  sort_field?: string = "add_time";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";
}

export class CancelOrderDto {
  @IsNumber()
  order_id: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class ConfirmReceiptDto {
  @IsNumber()
  order_id: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
