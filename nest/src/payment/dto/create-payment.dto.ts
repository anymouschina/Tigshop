import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export class CreatePaymentDto {
  @ApiProperty({ description: '订单ID' })
  @IsNumber()
  @Type(() => Number)
  orderId: number;

  @ApiProperty({ description: '支付金额' })
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: '支付方式', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: '支付渠道ID（可选）' })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiProperty({ description: '客户端IP' })
  @IsOptional()
  @IsString()
  clientIp?: string;

  @ApiProperty({ description: '用户代理' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: '支付回调URL' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiProperty({ description: '支付备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}