import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  IsArray,
  IsEnum,
  Min,
  Max,
} from "class-validator";

export const REFUND_TYPE = {
  0: "未知",
  1: "线上退款",
  2: "余额退款",
  3: "线下退款",
  4: "原路退回",
} as const;

export const REFUND_STATUS = {
  0: "待审核",
  1: "审核通过",
  2: "已拒绝",
  3: "已取消",
  4: "退款中",
  5: "退款成功",
  6: "退款失败",
} as const;

export const REFUND_LOG_TYPE = {
  0: "未知",
  1: "线上退款",
  2: "余额退款",
  3: "线下退款",
  4: "原路退回",
} as const;

export const REFUND_LOG_STATUS = {
  0: "待处理",
  1: "退款成功",
  2: "退款失败",
  3: "已取消",
} as const;

// 查询DTO
export class RefundQueryDto {
  @ApiProperty({ description: "关键词搜索", required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: "用户ID", required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ description: "订单ID", required: false })
  @IsOptional()
  @IsNumber()
  order_id?: number;

  @ApiProperty({
    description: "退款状态",
    required: false,
    enum: REFUND_STATUS,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  status?: number;

  @ApiProperty({ description: "退款类型", required: false, enum: REFUND_TYPE })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  refund_type?: number;

  @ApiProperty({ description: "开始时间", required: false })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiProperty({ description: "结束时间", required: false })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({ description: "页码", required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 10;

  @ApiProperty({ description: "排序字段", required: false })
  @IsOptional()
  @IsString()
  sort_field?: string = "add_time";

  @ApiProperty({
    description: "排序方式",
    required: false,
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsString()
  sort_order?: string = "desc";
}

// 创建退款申请DTO
export class CreateRefundDto {
  @ApiProperty({ description: "订单ID" })
  @IsNumber()
  order_id: number;

  @ApiProperty({ description: "用户ID" })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: "退款类型", enum: REFUND_TYPE })
  @IsNumber()
  @Min(0)
  @Max(4)
  refund_type: number;

  @ApiProperty({ description: "退款金额" })
  @IsNumber()
  @Min(0.01)
  refund_amount: number;

  @ApiProperty({ description: "退款原因", required: false })
  @IsOptional()
  @IsString()
  refund_reason?: string;

  @ApiProperty({ description: "退款说明", required: false })
  @IsOptional()
  @IsString()
  refund_note?: string;

  @ApiProperty({ description: "售后ID", required: false })
  @IsOptional()
  @IsNumber()
  aftersale_id?: number;

  @ApiProperty({ description: "店铺ID", required: false })
  @IsOptional()
  @IsNumber()
  shop_id?: number;
}

// 更新退款申请DTO
export class UpdateRefundDto {
  @ApiProperty({ description: "退款申请ID" })
  @IsNumber()
  refund_id: number;

  @ApiProperty({ description: "退款类型", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  refund_type?: number;

  @ApiProperty({ description: "退款金额", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  refund_amount?: number;

  @ApiProperty({ description: "退款原因", required: false })
  @IsOptional()
  @IsString()
  refund_reason?: string;

  @ApiProperty({ description: "退款说明", required: false })
  @IsOptional()
  @IsString()
  refund_note?: string;
}

// 处理退款DTO
export class ProcessRefundDto {
  @ApiProperty({ description: "退款申请ID" })
  @IsNumber()
  refund_id: number;

  @ApiProperty({ description: "退款方式", enum: REFUND_TYPE })
  @IsNumber()
  @Min(0)
  @Max(4)
  refund_method: number;

  @ApiProperty({ description: "实际退款金额" })
  @IsNumber()
  @Min(0.01)
  actual_amount: number;

  @ApiProperty({ description: "交易ID", required: false })
  @IsOptional()
  @IsString()
  transaction_id?: string;

  @ApiProperty({ description: "退款说明", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "是否线上退款", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  is_online?: number;

  @ApiProperty({ description: "是否线下退款", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  is_offline?: number;

  @ApiProperty({ description: "是否已收到", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  is_receive?: number;
}

// 批量处理退款DTO
export class BatchProcessRefundDto {
  @ApiProperty({ description: "退款申请ID列表" })
  @IsArray()
  @IsNumber({}, { each: true })
  refund_ids: number[];

  @ApiProperty({ description: "退款方式", enum: REFUND_TYPE })
  @IsNumber()
  @Min(0)
  @Max(4)
  refund_method: number;

  @ApiProperty({ description: "退款说明", required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

// 统计DTO
export class RefundStatsDto {
  @ApiProperty({ description: "开始时间", required: false })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiProperty({ description: "结束时间", required: false })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({ description: "店铺ID", required: false })
  @IsOptional()
  @IsNumber()
  shop_id?: number;
}
