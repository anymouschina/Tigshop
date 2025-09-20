// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { PaymentMethod, PaymentStatus } from "./create-payment.dto";

export class PaymentQueryDto {
  @ApiProperty({ description: "页码", required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  size?: number = 15;

  @ApiProperty({ description: "订单ID", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orderId?: number;

  @ApiProperty({ description: "用户ID", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({
    description: "支付方式",
    required: false,
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: "支付状态",
    required: false,
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({ description: "交易号", required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ description: "渠道订单号", required: false })
  @IsOptional()
  @IsString()
  channelOrderId?: string;

  @ApiProperty({ description: "最小金额", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minAmount?: number;

  @ApiProperty({ description: "最大金额", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxAmount?: number;

  @ApiProperty({ description: "开始时间", required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ description: "结束时间", required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ description: "是否启用", required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 1 || value === "true")
  isEnable?: boolean;
}
