// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsInt,
  MaxLength,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class RefundLogQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  user_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  refund_apply_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  refund_type?: number = -1;

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
  sort_field?: string = "id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";
}

export class RefundLogDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateRefundLogDto {
  @IsNumber()
  @Type(() => Number)
  order_id: number;

  @IsNumber()
  @Type(() => Number)
  refund_apply_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(4)
  refund_type: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  refund_amount: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  user_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  refund_note?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  payment_voucher?: string = "";
}

export class UpdateRefundLogDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @Type(() => Number)
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

export class DeleteRefundLogDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteRefundLogDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const REFUND_LOG_TYPE = {
  0: "未知",
  1: "线上退款",
  2: "余额退款",
  3: "线下退款",
  4: "原路退回",
};

export const REFUND_LOG_STATUS = {
  0: "待处理",
  1: "退款成功",
  2: "退款失败",
  3: "已取消",
};
