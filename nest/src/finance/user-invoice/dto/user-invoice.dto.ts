// @ts-nocheck
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum UserInvoiceStatus {
  PENDING = 1, // 待审核
  APPROVED = 2, // 已通过
  REJECTED = 3, // 已拒绝
}

export enum TitleType {
  PERSONAL = 1, // 个人
  COMPANY = 2, // 企业
}

export class UserInvoiceQueryDto {
  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  size?: number = 15;

  @ApiProperty({ description: '状态', required: false, enum: UserInvoiceStatus })
  @IsOptional()
  @IsEnum(UserInvoiceStatus)
  status?: UserInvoiceStatus;

  @ApiProperty({ description: '排序字段', required: false, default: 'invoice_id' })
  @IsOptional()
  @IsString()
  sortField?: string = 'invoice_id';

  @ApiProperty({ description: '排序方向', required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;
}

export class CreateUserInvoiceDto {
  @ApiProperty({ description: '用户ID' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: '发票抬头类型', enum: TitleType })
  @IsNotEmpty()
  @IsEnum(TitleType)
  titleType: TitleType;

  @ApiProperty({ description: '发票抬头' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '纳税人识别号', required: false })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiProperty({ description: '注册地址', required: false })
  @IsOptional()
  @IsString()
  registerAddress?: string;

  @ApiProperty({ description: '注册电话', required: false })
  @IsOptional()
  @IsString()
  registerPhone?: string;

  @ApiProperty({ description: '开户银行', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: '银行账号', required: false })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiProperty({ description: '状态', enum: UserInvoiceStatus, default: UserInvoiceStatus.PENDING })
  @IsOptional()
  @IsEnum(UserInvoiceStatus)
  status?: UserInvoiceStatus = UserInvoiceStatus.PENDING;

  @ApiProperty({ description: '申请说明', required: false })
  @IsOptional()
  @IsString()
  applyRemark?: string;
}

export class UpdateUserInvoiceDto {
  @ApiProperty({ description: '状态', enum: UserInvoiceStatus })
  @IsNotEmpty()
  @IsEnum(UserInvoiceStatus)
  status: UserInvoiceStatus;

  @ApiProperty({ description: '审核回复', required: false })
  @IsOptional()
  @IsString()
  applyReply?: string;

  @ApiProperty({ description: '发票抬头类型', enum: TitleType, required: false })
  @IsOptional()
  @IsEnum(TitleType)
  titleType?: TitleType;

  @ApiProperty({ description: '发票抬头', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '纳税人识别号', required: false })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiProperty({ description: '注册地址', required: false })
  @IsOptional()
  @IsString()
  registerAddress?: string;

  @ApiProperty({ description: '注册电话', required: false })
  @IsOptional()
  @IsString()
  registerPhone?: string;

  @ApiProperty({ description: '开户银行', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: '银行账号', required: false })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiProperty({ description: '申请说明', required: false })
  @IsOptional()
  @IsString()
  applyRemark?: string;
}

export class UserInvoiceConfigDto {
  @ApiProperty({ description: '状态配置' })
  statusConfig: Record<string, string>;

  @ApiProperty({ description: '抬头类型配置' })
  titleTypeConfig: Record<string, string>;
}
