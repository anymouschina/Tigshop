// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from "class-validator";

export enum OrderStatus {
  PENDING = 0,
  CONFIRMED = 1,
  PROCESSING = 2,
  SHIPPED = 3,
  COMPLETED = 4,
  CANCELLED = 5,
  REFUNDED = 6,
}

export enum PaymentStatus {
  UNPAID = 0,
  PAID = 1,
  REFUNDED = 2,
  PARTIALLY_REFUNDED = 3,
}

export enum ShippingStatus {
  UNSHIPPED = 0,
  SHIPPED = 1,
  RECEIVED = 2,
}

export class AdminOrderQueryDto {
  @ApiProperty({ description: "关键词", required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: "页码", required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false })
  @IsOptional()
  @IsNumber()
  size?: number = 15;

  @ApiProperty({ description: "订单状态", required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  order_status?: OrderStatus;

  @ApiProperty({ description: "支付状态", required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  pay_status?: PaymentStatus;

  @ApiProperty({ description: "配送状态", required: false })
  @IsOptional()
  @IsEnum(ShippingStatus)
  shipping_status?: ShippingStatus;

  @ApiProperty({ description: "订单类型", required: false })
  @IsOptional()
  @IsNumber()
  order_type?: number;

  @ApiProperty({ description: "时间类型", required: false })
  @IsOptional()
  @IsString()
  time_type?: string;

  @ApiProperty({ description: "开始时间", required: false })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiProperty({ description: "结束时间", required: false })
  @IsOptional()
  @IsString()
  end_time?: string;
}

export class AdminOrderDetailDto {
  @ApiProperty({ description: "订单ID" })
  @IsNumber()
  id: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: "订单状态" })
  @IsEnum(OrderStatus)
  order_status: OrderStatus;

  @ApiProperty({ description: "备注", required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateOrderShippingDto {
  @ApiProperty({ description: "快递公司" })
  @IsString()
  shipping_company: string;

  @ApiProperty({ description: "快递单号" })
  @IsString()
  tracking_number: string;

  @ApiProperty({ description: "配送状态", required: false })
  @IsOptional()
  @IsEnum(ShippingStatus)
  shipping_status?: ShippingStatus;

  @ApiProperty({ description: "配送备注", required: false })
  @IsOptional()
  @IsString()
  shipping_remark?: string;
}

export class UpdateOrderPaymentDto {
  @ApiProperty({ description: "支付状态" })
  @IsEnum(PaymentStatus)
  pay_status: PaymentStatus;

  @ApiProperty({ description: "支付金额", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pay_amount?: number;

  @ApiProperty({ description: "支付方式", required: false })
  @IsOptional()
  @IsString()
  pay_method?: string;

  @ApiProperty({ description: "支付时间", required: false })
  @IsOptional()
  @IsString()
  pay_time?: string;

  @ApiProperty({ description: "交易号", required: false })
  @IsOptional()
  @IsString()
  trade_no?: string;
}

export class BatchOrderOperationDto {
  @ApiProperty({ description: "订单ID列表" })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({ description: "操作类型" })
  @IsEnum(["confirm", "ship", "complete", "cancel", "delete"])
  type: string;

  @ApiProperty({ description: "操作数据", required: false })
  @IsOptional()
  data?: any;
}
