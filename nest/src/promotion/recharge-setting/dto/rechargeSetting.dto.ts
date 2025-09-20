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

export enum RechargeSettingStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

export class RechargeSettingQueryDto {
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
    enum: RechargeSettingStatus,
  })
  @IsOptional()
  @IsEnum(RechargeSettingStatus)
  status?: RechargeSettingStatus;

  @ApiProperty({
    description: "排序字段",
    required: false,
    default: "setting_id",
  })
  @IsOptional()
  @IsString()
  sortField?: string = "setting_id";

  @ApiProperty({
    description: "排序方向",
    required: false,
    default: "desc",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}

export class CreateRechargeSettingDto {
  @ApiProperty({ description: "金额" })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0)
  Amount: number;

  @ApiProperty({ description: "赠送金额" })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0)
  GiveAmount: number;

  @ApiProperty({ description: "排序" })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0)
  @Max(999)
  Sort: number;
}

export class UpdateRechargeSettingDto {
  @ApiProperty({ description: "金额", required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  Amount?: number;

  @ApiProperty({ description: "赠送金额", required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  GiveAmount?: number;

  @ApiProperty({ description: "status", required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;

  @ApiProperty({ description: "排序", required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(999)
  Sort?: number;
}

export class RechargeSettingConfigDto {
  @ApiProperty({ description: "状态配置" })
  statusConfig: Record<string, string>;
}
