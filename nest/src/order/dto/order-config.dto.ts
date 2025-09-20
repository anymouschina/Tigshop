import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsEnum, Min, Max } from 'class-validator';

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  UNIONPAY = 'unionpay',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SAME_DAY = 'same_day',
  PICKUP = 'pickup',
}

export class UpdateOrderConfigDto {
  @ApiProperty({ description: '自动确认订单时间（小时）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  auto_confirm_hours?: number;

  @ApiProperty({ description: '自动完成订单时间（小时）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  auto_complete_hours?: number;

  @ApiProperty({ description: '自动取消订单时间（分钟）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  auto_cancel_minutes?: number;

  @ApiProperty({ description: '是否启用订单评价', required: false })
  @IsOptional()
  @IsBoolean()
  enable_review?: boolean;

  @ApiProperty({ description: '是否启用发票', required: false })
  @IsOptional()
  @IsBoolean()
  enable_invoice?: boolean;

  @ApiProperty({ description: '最小订单金额', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @ApiProperty({ description: '免费配送金额', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  free_shipping_amount?: number;
}

export class OrderPaymentConfigDto {
  @ApiProperty({ description: '启用的支付方式' })
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  enabled_methods: PaymentMethod[];

  @ApiProperty({ description: '默认支付方式', required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  default_method?: PaymentMethod;

  @ApiProperty({ description: '支付宝配置', required: false })
  @IsOptional()
  alipay_config?: {
    app_id: string;
    merchant_id: string;
    private_key: string;
    public_key: string;
  };

  @ApiProperty({ description: '微信支付配置', required: false })
  @IsOptional()
  wechat_config?: {
    app_id: string;
    merchant_id: string;
    api_key: string;
  };
}

export class OrderShippingConfigDto {
  @ApiProperty({ description: '启用的配送方式' })
  @IsArray()
  @IsEnum(ShippingMethod, { each: true })
  enabled_methods: ShippingMethod[];

  @ApiProperty({ description: '标准配送费用', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  standard_fee?: number;

  @ApiProperty({ description: '快速配送费用', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  express_fee?: number;

  @ApiProperty({ description: '当日达费用', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  same_day_fee?: number;

  @ApiProperty({ description: '配送区域配置', required: false })
  @IsOptional()
  area_config?: Array<{
    area_code: string;
    fee: number;
    free_amount?: number;
  }>;
}