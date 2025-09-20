// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum RechargeOrderStatus {
  PENDING = 0, // 待支付
  PAID = 1, // 已支付
  CANCELLED = 2, // 已取消
  REFUNDED = 3, // 已退款
}

export enum PaymentType {
  ALIPAY = "alipay", // 支付宝
  WECHAT = "wechat", // 微信支付
  BALANCE = "balance", // 余额支付
  BANK = "bank", // 银行转账
}

export class UserRechargeOrderQueryDto {
  @ApiProperty({ description: "搜索关键词", required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: "页码", required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  size?: number = 15;

  @ApiProperty({
    description: "状态",
    required: false,
    enum: RechargeOrderStatus,
  })
  @IsOptional()
  @IsEnum(RechargeOrderStatus)
  status?: RechargeOrderStatus;

  @ApiProperty({ description: "用户ID", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: "支付方式", required: false, enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @ApiProperty({
    description: "排序字段",
    required: false,
    default: "order_id",
  })
  @IsOptional()
  @IsString()
  sortField?: string = "order_id";

  @ApiProperty({
    description: "排序方向",
    required: false,
    default: "desc",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";

  @ApiProperty({ description: "开始时间", required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ description: "结束时间", required: false })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class CreateUserRechargeOrderDto {
  @ApiProperty({ description: "用户ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: "充值金额" })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: "备注", required: false })
  @IsOptional()
  @IsString()
  postscript?: string;

  @ApiProperty({ description: "支付方式", enum: PaymentType, required: false })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @ApiProperty({
    description: "状态",
    enum: RechargeOrderStatus,
    default: RechargeOrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RechargeOrderStatus)
  status?: RechargeOrderStatus = RechargeOrderStatus.PENDING;

  @ApiProperty({ description: "管理员ID（后台创建时）", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  adminId?: number;
}

export class UpdateUserRechargeOrderDto {
  @ApiProperty({ description: "状态", enum: RechargeOrderStatus })
  @IsOptional()
  @IsEnum(RechargeOrderStatus)
  status?: RechargeOrderStatus;

  @ApiProperty({ description: "备注", required: false })
  @IsOptional()
  @IsString()
  postscript?: string;

  @ApiProperty({ description: "支付方式", enum: PaymentType, required: false })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @ApiProperty({ description: "支付时间", required: false })
  @IsOptional()
  @IsString()
  paymentTime?: string;

  @ApiProperty({ description: "交易号", required: false })
  @IsOptional()
  @IsString()
  tradeNo?: string;

  @ApiProperty({ description: "管理员备注", required: false })
  @IsOptional()
  @IsString()
  adminRemark?: string;
}

export class RechargeOrderStatisticsDto {
  @ApiProperty({ description: "总充值金额" })
  totalAmount: number;

  @ApiProperty({ description: "成功充值金额" })
  successAmount: number;

  @ApiProperty({ description: "待支付金额" })
  pendingAmount: number;

  @ApiProperty({ description: "总订单数" })
  totalCount: number;

  @ApiProperty({ description: "成功订单数" })
  successCount: number;

  @ApiProperty({ description: "待支付订单数" })
  pendingCount: number;

  @ApiProperty({ description: "今日充值金额" })
  todayAmount: number;

  @ApiProperty({ description: "今日充值订单数" })
  todayCount: number;
}

export class UserRechargeOrderConfigDto {
  @ApiProperty({ description: "状态配置" })
  statusConfig: Record<string, string>;

  @ApiProperty({ description: "支付方式配置" })
  paymentTypeConfig: Record<string, string>;

  @ApiProperty({ description: "最小充值金额" })
  minAmount: number;

  @ApiProperty({ description: "最大充值金额" })
  maxAmount: number;
}
