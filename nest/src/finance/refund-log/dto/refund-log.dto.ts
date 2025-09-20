// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { RefundLogType } from "../entities/refund-log.entity";

export class RefundLogQueryDto {
  @ApiProperty({ description: "页码", default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: "每页数量", default: 15 })
  @IsOptional()
  @IsNumber()
  size?: number = 15;

  @ApiProperty({ description: "搜索关键词", required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: "退款类型",
    enum: RefundLogType,
    required: false,
  })
  @IsOptional()
  @IsEnum(RefundLogType)
  type?: RefundLogType;

  @ApiProperty({ description: "排序字段", default: "log_id" })
  @IsOptional()
  @IsString()
  sort_field?: string = "log_id";

  @ApiProperty({ description: "排序方式", default: "desc" })
  @IsOptional()
  @IsString()
  sort_order?: string = "desc";
}
