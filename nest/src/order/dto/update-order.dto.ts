import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus, ShippingStatus, PayStatus } from './create-order.dto';
import { IsEnum, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiProperty({ description: '订单状态', enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: '支付状态', enum: PayStatus, required: false })
  @IsOptional()
  @IsEnum(PayStatus)
  paymentStatus?: PayStatus;

  @ApiProperty({ description: '发货状态', enum: ShippingStatus, required: false })
  @IsOptional()
  @IsEnum(ShippingStatus)
  shippingStatus?: ShippingStatus;

  @ApiProperty({ description: '支付时间', required: false })
  @IsOptional()
  @IsString()
  payTime?: string;

  @ApiProperty({ description: '发货时间', required: false })
  @IsOptional()
  @IsString()
  shippingTime?: string;

  @ApiProperty({ description: '收货时间', required: false })
  @IsOptional()
  @IsString()
  receivedTime?: string;

  @ApiProperty({ description: '完成时间', required: false })
  @IsOptional()
  @IsString()
  completedTime?: string;

  @ApiProperty({ description: '物流公司ID', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  logisticsId?: number;

  @ApiProperty({ description: '物流单号', required: false })
  @IsOptional()
  @IsString()
  trackingNo?: string;

  @ApiProperty({ description: '物流公司名称', required: false })
  @IsOptional()
  @IsString()
  logisticsName?: string;

  @ApiProperty({ description: '支付方式', required: false })
  @IsOptional()
  @IsString()
  payType?: string;

  @ApiProperty({ description: '交易号', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ description: '已支付金额', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  paidAmount?: number;

  @ApiProperty({ description: '商家备注', required: false })
  @IsOptional()
  @IsString()
  adminNote?: string;

  @ApiProperty({ description: '订单扩展数据', required: false })
  @IsOptional()
  @IsString()
  orderExtension?: string;

  @ApiProperty({ description: '地址数据', required: false })
  @IsOptional()
  @IsString()
  addressData?: string;

  @ApiProperty({ description: '标记', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  mark?: number;
}
