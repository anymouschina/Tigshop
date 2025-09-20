// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsNotEmpty,
  Min,
  ValidateNested,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum WithdrawStatus {
  PENDING = 0, // 待审核
  APPROVED = 1, // 已通过
  REJECTED = 2, // 已拒绝
  PROCESSING = 3, // 处理中
  COMPLETED = 4, // 已完成
  FAILED = 5, // 已失败
}

export enum WithdrawType {
  ALIPAY = "alipay", // 支付宝
  WECHAT = "wechat", // 微信
  BANK = "bank", // 银行卡
}

export class WithdrawAccountData {
  @ApiProperty({ description: "提现方式", enum: WithdrawType })
  @IsNotEmpty()
  @IsEnum(WithdrawType)
  type: WithdrawType;

  @ApiProperty({ description: "收款人姓名" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: "账号" })
  @IsNotEmpty()
  @IsString()
  account: string;

  @ApiProperty({ description: "银行名称（银行卡提现时必填）", required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: "开户行（银行卡提现时必填）", required: false })
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiProperty({ description: "手机号", required: false })
  @IsOptional()
  @IsString()
  mobile?: string;
}

export class UserWithdrawApplyQueryDto {
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

  @ApiProperty({ description: "状态", required: false, enum: WithdrawStatus })
  @IsOptional()
  @IsEnum(WithdrawStatus)
  status?: WithdrawStatus;

  @ApiProperty({ description: "用户ID", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: "提现方式", required: false, enum: WithdrawType })
  @IsOptional()
  @IsEnum(WithdrawType)
  withdrawType?: WithdrawType;

  @ApiProperty({ description: "排序字段", required: false, default: "id" })
  @IsOptional()
  @IsString()
  sortField?: string = "id";

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

export class CreateUserWithdrawApplyDto {
  @ApiProperty({ description: "用户ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: "提现金额" })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: "提现说明", required: false })
  @IsOptional()
  @IsString()
  postscript?: string;

  @ApiProperty({ description: "账户信息" })
  @IsNotEmpty()
  @ValidateNested()
  accountData: WithdrawAccountData;

  @ApiProperty({
    description: "状态",
    enum: WithdrawStatus,
    default: WithdrawStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(WithdrawStatus)
  status?: WithdrawStatus = WithdrawStatus.PENDING;
}

export class UpdateUserWithdrawApplyDto {
  @ApiProperty({ description: "状态", enum: WithdrawStatus })
  @IsOptional()
  @IsEnum(WithdrawStatus)
  status?: WithdrawStatus;

  @ApiProperty({ description: "提现说明", required: false })
  @IsOptional()
  @IsString()
  postscript?: string;

  @ApiProperty({ description: "审核回复", required: false })
  @IsOptional()
  @IsString()
  applyReply?: string;

  @ApiProperty({ description: "管理员备注", required: false })
  @IsOptional()
  @IsString()
  adminRemark?: string;

  @ApiProperty({ description: "处理时间", required: false })
  @IsOptional()
  @IsString()
  processTime?: string;

  @ApiProperty({ description: "完成时间", required: false })
  @IsOptional()
  @IsString()
  completeTime?: string;

  @ApiProperty({ description: "交易号", required: false })
  @IsOptional()
  @IsString()
  tradeNo?: string;
}

export class WithdrawStatisticsDto {
  @ApiProperty({ description: "总提现金额" })
  totalAmount: number;

  @ApiProperty({ description: "成功提现金额" })
  successAmount: number;

  @ApiProperty({ description: "待审核金额" })
  pendingAmount: number;

  @ApiProperty({ description: "总申请数" })
  totalCount: number;

  @ApiProperty({ description: "成功申请数" })
  successCount: number;

  @ApiProperty({ description: "待审核申请数" })
  pendingCount: number;

  @ApiProperty({ description: "今日提现金额" })
  todayAmount: number;

  @ApiProperty({ description: "今日提现申请数" })
  todayCount: number;
}

export class UserWithdrawApplyConfigDto {
  @ApiProperty({ description: "状态配置" })
  statusConfig: Record<string, string>;

  @ApiProperty({ description: "提现方式配置" })
  withdrawTypeConfig: Record<string, string>;

  @ApiProperty({ description: "最小提现金额" })
  minAmount: number;

  @ApiProperty({ description: "最大提现金额" })
  maxAmount: number;

  @ApiProperty({ description: "提现手续费率" })
  feeRate: number;

  @ApiProperty({ description: "每日提现限额" })
  dailyLimit: number;
}
