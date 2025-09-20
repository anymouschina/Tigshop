import { IsNumber, IsString, IsOptional, IsEnum, IsArray, IsObject, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum WithdrawStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export enum AccountType {
  BANK = 1,
  ALIPAY = 2,
  WECHAT = 3,
  PAYPAL = 4,
}

export enum WithdrawSortField {
  ADD_TIME = 'add_time',
  AMOUNT = 'amount',
  FINISHED_TIME = 'finished_time',
}

export enum WithdrawSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class WithdrawQueryDto {
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
  @IsEnum(WithdrawStatus)
  status?: WithdrawStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(WithdrawSortField)
  sort_field?: WithdrawSortField = WithdrawSortField.ADD_TIME;

  @IsOptional()
  @IsEnum(WithdrawSortOrder)
  sort_order?: WithdrawSortOrder = WithdrawSortOrder.DESC;
}

export class WithdrawAccountQueryDto {
  @IsOptional()
  @IsEnum(AccountType)
  account_type?: AccountType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  account_id?: number;
}

export class CreateWithdrawAccountDto {
  @IsEnum(AccountType)
  account_type: AccountType;

  @IsString()
  account_name: string;

  @IsString()
  account_no: string;

  @IsOptional()
  @IsString()
  identity?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;
}

export class UpdateWithdrawAccountDto {
  @IsNumber()
  account_id: number;

  @IsEnum(AccountType)
  account_type: AccountType;

  @IsString()
  account_name: string;

  @IsString()
  account_no: string;

  @IsOptional()
  @IsString()
  identity?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;
}

export class CreateWithdrawApplyDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsObject()
  account_data: CreateWithdrawAccountDto;
}

export class WithdrawAccountDetailDto {
  @IsNumber()
  account_id: number;
}

export class DeleteWithdrawAccountDto {
  @IsNumber()
  account_id: number;
}