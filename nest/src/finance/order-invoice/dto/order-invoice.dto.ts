import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum } from 'class-validator';

export enum InvoiceType {
  PERSONAL = 0,
  COMPANY = 1,
}

export enum InvoiceStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export class QueryOrderInvoiceDto {
  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '发票类型', required: false })
  @IsOptional()
  @IsNumber()
  invoice_type?: number;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '店铺类型', required: false })
  @IsOptional()
  @IsNumber()
  shop_type?: number;

  @ApiProperty({ description: '店铺ID', required: false })
  @IsOptional()
  @IsNumber()
  shop_id?: number;

  @ApiProperty({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: '每页数量', default: 15 })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiProperty({ description: '排序字段', default: 'id' })
  @IsOptional()
  @IsString()
  sort_field?: string;

  @ApiProperty({ description: '排序方式', default: 'desc' })
  @IsOptional()
  @IsString()
  sort_order?: string;
}

export class CreateOrderInvoiceDto {
  @ApiProperty({ description: '用户ID' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: '订单ID' })
  @IsNumber()
  order_id: number;

  @ApiProperty({ description: '发票类型' })
  @IsEnum(InvoiceType)
  invoice_type: InvoiceType;

  @ApiProperty({ description: '发票抬头' })
  @IsString()
  invoice_title: string;

  @ApiProperty({ description: '税号', required: false })
  @IsOptional()
  @IsString()
  tax_no?: string;

  @ApiProperty({ description: '地址', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: '电话', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '开户行', required: false })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiProperty({ description: '银行账号', required: false })
  @IsOptional()
  @IsString()
  bank_account?: string;

  @ApiProperty({ description: '发票金额' })
  @IsNumber()
  amount: number;
}

export class UpdateOrderInvoiceDto {
  @ApiProperty({ description: '发票申请ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '状态' })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiProperty({ description: '金额', required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ description: '申请回复', required: false })
  @IsOptional()
  @IsString()
  apply_reply?: string;

  @ApiProperty({ description: '发票附件', required: false })
  @IsOptional()
  @IsString()
  invoice_attachment?: string;
}