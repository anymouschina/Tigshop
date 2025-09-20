// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
} from "class-validator";

export enum PointsLogType {
  REGISTER = 1,
  LOGIN = 2,
  ORDER = 3,
  COMMENT = 4,
  REFERRAL = 5,
  ADMIN_ADD = 6,
  ADMIN_MINUS = 7,
  EXCHANGE = 8,
}

export class CreateUserPointsLogDto {
  @ApiProperty({ description: "用户ID" })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: "积分数量" })
  @IsNumber()
  points: number;

  @ApiProperty({ description: "积分类型" })
  @IsEnum(PointsLogType)
  type: PointsLogType;

  @ApiProperty({ description: "备注" })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class BatchDeleteDto {
  @ApiProperty({ description: "ID数组" })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({ description: "操作类型" })
  @IsString()
  type: string;
}

export class QueryPointsLogDto {
  @ApiProperty({ description: "关键词", required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: "用户ID", required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ description: "开始日期", required: false })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({ description: "结束日期", required: false })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiProperty({ description: "积分类型", required: false })
  @IsOptional()
  @IsEnum(PointsLogType)
  type?: PointsLogType;

  @ApiProperty({ description: "页码", default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: "每页数量", default: 15 })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiProperty({ description: "排序字段", default: "log_id" })
  @IsOptional()
  @IsString()
  sort_field?: string;

  @ApiProperty({ description: "排序方式", default: "desc" })
  @IsOptional()
  @IsString()
  sort_order?: string;
}
