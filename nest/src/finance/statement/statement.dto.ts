import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsInt, MaxLength, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class StatementQueryDto {
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
  shop_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  type?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  status?: number = -1;

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

export class StatementDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateStatementDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  type: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amount: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  user_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  shop_id: number;

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

export class UpdateStatementDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  type?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(3)
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  admin_remark?: string;
}

export class DeleteStatementDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteStatementDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const STATEMENT_TYPE = {
  0: '收入',
  1: '支出',
  2: '订单收入',
  3: '退款支出',
  4: '佣金收入',
  5: '提现支出',
  6: '充值收入',
  7: '余额支出',
  8: '积分兑换',
  9: '罚款支出',
  10: '其他',
};

export const STATEMENT_STATUS = {
  0: '待审核',
  1: '已确认',
  2: '已拒绝',
  3: '已取消',
};