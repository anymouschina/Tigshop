import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsInt, MaxLength, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UserBalanceLogQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  user_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  type?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
  change_type?: number = -1;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 15;

  @IsOptional()
  @IsString()
  sort_field?: string = 'id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class UserBalanceLogDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateUserBalanceLogDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  user_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  type: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(2)
  change_type: number;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsNumber()
  @Type(() => Number)
  balance: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string = '';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_id?: number = 0;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  related_id?: string = '';
}

export class UpdateUserBalanceLogDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  type?: number;

  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  admin_remark?: string;
}

export class DeleteUserBalanceLogDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteUserBalanceLogDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const USER_BALANCE_LOG_TYPE = {
  0: '订单支付',
  1: '订单退款',
  2: '充值',
  3: '提现',
  4: '系统调整',
  5: '其他',
};

export const BALANCE_CHANGE_TYPE = {
  0: '增加',
  1: '减少',
  2: '冻结',
};