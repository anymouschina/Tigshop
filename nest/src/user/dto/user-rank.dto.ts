// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from "class-validator";

export class UserRankQueryDto {
  @ApiProperty({ description: "关键词", required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: "页码", required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false })
  @IsOptional()
  @IsNumber()
  size?: number = 15;

  @ApiProperty({ description: "状态", required: false })
  @IsOptional()
  @IsNumber()
  status?: number;
}

export class CreateUserRankDto {
  @ApiProperty({ description: "等级名称" })
  @IsString()
  @MaxLength(50)
  rank_name: string;

  @ApiProperty({ description: "等级描述", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ description: "所需积分" })
  @IsNumber()
  @Min(0)
  points: number;

  @ApiProperty({ description: "折扣率", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_rate?: number = 100;

  @ApiProperty({ description: "排序", required: false })
  @IsOptional()
  @IsNumber()
  sort_order?: number = 0;

  @ApiProperty({ description: "是否启用" })
  @IsBoolean()
  is_enabled: boolean = true;

  @ApiProperty({ description: "等级图标", required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: "等级颜色", required: false })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateUserRankDto {
  @ApiProperty({ description: "等级名称", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rank_name?: string;

  @ApiProperty({ description: "等级描述", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ description: "所需积分", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiProperty({ description: "折扣率", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_rate?: number;

  @ApiProperty({ description: "排序", required: false })
  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @ApiProperty({ description: "是否启用", required: false })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @ApiProperty({ description: "等级图标", required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: "等级颜色", required: false })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateUserRankFieldDto {
  @ApiProperty({ description: "字段名" })
  @IsString()
  field: string;

  @ApiProperty({ description: "字段值" })
  value: any;
}

export class BatchUserRankOperationDto {
  @ApiProperty({ description: "等级ID列表" })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({ description: "操作类型" })
  @IsEnum(["del", "enable", "disable"])
  type: string;
}
