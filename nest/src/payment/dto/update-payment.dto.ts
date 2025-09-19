import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsEnum, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
// These enums don't exist in the schema, define them here
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdatePaymentDto {
  @ApiProperty({ description: '支付状态', enum: PaymentStatus, required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({ description: '交易号', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ description: '支付时间', required: false })
  @IsOptional()
  @IsString()
  paidTime?: string;

  @ApiProperty({ description: '回调时间', required: false })
  @IsOptional()
  @IsString()
  callbackTime?: string;

  @ApiProperty({ description: '回调数据', required: false })
  @IsOptional()
  callbackData?: any;

  @ApiProperty({ description: '退款金额', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  refundAmount?: number;

  @ApiProperty({ description: '退款状态', enum: RefundStatus, required: false })
  @IsOptional()
  @IsEnum(RefundStatus)
  refundStatus?: RefundStatus;

  @ApiProperty({ description: '退款时间', required: false })
  @IsOptional()
  @IsString()
  refundTime?: string;

  @ApiProperty({ description: '退款原因', required: false })
  @IsOptional()
  @IsString()
  refundReason?: string;
}