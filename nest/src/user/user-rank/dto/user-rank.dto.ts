// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  Min,
  Max,
} from "class-validator";

export class QueryUserRankDto {
  @ApiProperty({ description: "等级名称", required: false })
  @IsOptional()
  @IsString()
  rank_name?: string;

  @ApiProperty({ description: "页码", default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: "每页数量", default: 15 })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiProperty({ description: "排序字段", default: "rank_id" })
  @IsOptional()
  @IsString()
  sort_field?: string;

  @ApiProperty({ description: "排序方式", default: "asc" })
  @IsOptional()
  @IsString()
  sort_order?: string;
}

export class CreateUserRankDto {
  @ApiProperty({ description: "等级名称" })
  @IsString()
  rank_name: string;

  @ApiProperty({ description: "等级类型" })
  @IsNumber()
  rank_type: number;

  @ApiProperty({ description: "等级图标", required: false })
  @IsOptional()
  @IsString()
  rank_logo?: string;

  @ApiProperty({ description: "等级级别" })
  @IsNumber()
  rank_level: number;

  @ApiProperty({ description: "最小积分" })
  @IsNumber()
  @Min(0)
  min_points: number;

  @ApiProperty({ description: "最大积分" })
  @IsNumber()
  @Min(0)
  max_points: number;

  @ApiProperty({ description: "折扣率" })
  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;

  @ApiProperty({ description: "描述", required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateUserRankDto {
  @ApiProperty({ description: "等级类型" })
  @IsNumber()
  rank_type: number;

  @ApiProperty({ description: "等级数据" })
  @IsObject()
  data: {
    rank_name?: string;
    rank_logo?: string;
    rank_level?: number;
    min_points?: number;
    max_points?: number;
    discount?: number;
    description?: string;
  };

  @ApiProperty({ description: "用户等级配置", required: false })
  @IsOptional()
  @IsObject()
  user_rank_config?: object;

  @ApiProperty({ description: "成长设置", required: false })
  @IsOptional()
  @IsObject()
  grow_up_setting?: object;
}
