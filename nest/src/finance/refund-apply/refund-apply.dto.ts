import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsInt, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RefundApplyQueryDto {
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
  @Max(3)
  status?: number = -1;

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

export class RefundApplyDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateRefundApplyDto {
  @IsNumber()
  @Type(() => Number)
  order_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  refund_amount: number;

  @IsString()
  @MaxLength(500)
  refund_reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  refund_images?: string = '';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;
}

export class UpdateRefundApplyDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  admin_remark?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  refund_amount?: number;
}

export class DeleteRefundApplyDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteRefundApplyDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const REFUND_APPLY_STATUS = {
  0: '待审核',
  1: '审核通过',
  2: '已拒绝',
  3: '已取消',
};