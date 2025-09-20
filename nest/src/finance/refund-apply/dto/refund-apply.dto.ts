// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

export enum RefundStatus {
  WAIT = 0,
  PROCESSED = 1,
  FAILED = 2,
}

export enum RefundType {
  ONLINE = 1,
  BALANCE = 2,
  OFFLINE = 3,
}

export class RefundApplyQueryDto {
  @ApiProperty({ description: "搜索关键词", required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: "退款状态", enum: RefundStatus, required: false })
  @IsOptional()
  @IsEnum(RefundStatus)
  refund_status?: RefundStatus;

  @ApiProperty({ description: "页码", default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: "每页数量", default: 15 })
  @IsOptional()
  @IsNumber()
  size?: number = 15;

  @ApiProperty({ description: "排序字段", default: "refund_id" })
  @IsOptional()
  @IsString()
  sort_field?: string = "refund_id";

  @ApiProperty({ description: "排序方式", default: "desc" })
  @IsOptional()
  @IsString()
  sort_order?: string = "desc";
}

export class RefundApplyAuditDto {
  @ApiProperty({ description: "退款申请ID" })
  @IsNumber()
  refund_id: number;

  @ApiProperty({ description: "退款状态", enum: RefundStatus })
  @IsEnum(RefundStatus)
  refund_status: RefundStatus;

  @ApiProperty({ description: "退款备注", required: false })
  @IsOptional()
  @IsString()
  refund_note?: string;

  @ApiProperty({ description: "线上退款金额", required: false })
  @ValidateIf((o) => o.refund_status === RefundStatus.PROCESSED)
  @IsNumber()
  online_balance?: number;

  @ApiProperty({ description: "余额退款金额", required: false })
  @ValidateIf((o) => o.refund_status === RefundStatus.PROCESSED)
  @IsNumber()
  refund_balance?: number;

  @ApiProperty({ description: "线下退款金额", required: false })
  @ValidateIf((o) => o.refund_status === RefundStatus.PROCESSED)
  @IsNumber()
  offline_balance?: number;

  @ApiProperty({ description: "支付凭证", required: false })
  @IsOptional()
  @IsString()
  payment_voucher?: string;
}

export class RefundApplyOfflineAuditDto {
  @ApiProperty({ description: "退款申请ID" })
  @IsNumber()
  refund_id: number;
}
