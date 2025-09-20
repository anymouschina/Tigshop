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

export enum HomeStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

export class HomeQueryDto {
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

  @ApiProperty({ description: "状态", required: false, enum: HomeStatus })
  @IsOptional()
  @IsEnum(HomeStatus)
  status?: HomeStatus;

  @ApiProperty({ description: "排序字段", required: false, default: "home_id" })
  @IsOptional()
  @IsString()
  sortField?: string = "home_id";

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

export class CreateHomeDto {
  @ApiProperty({ description: "名称" })
  @IsNotEmpty()
  @IsString()
  Name: string;

  @ApiProperty({ description: "type" })
  @IsNotEmpty()
  @IsString()
  Type: string;

  @ApiProperty({ description: "内容" })
  @IsNotEmpty()
  @IsString()
  Content: string;
}

export class UpdateHomeDto {
  @ApiProperty({ description: "名称", required: false })
  @IsOptional()
  @IsString()
  Name?: string;

  @ApiProperty({ description: "type", required: false })
  @IsOptional()
  @IsString()
  Type?: string;

  @ApiProperty({ description: "内容", required: false })
  @IsOptional()
  @IsString()
  Content?: string;

  @ApiProperty({ description: "status", required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;
}

export class HomeConfigDto {
  @ApiProperty({ description: "状态配置" })
  statusConfig: Record<string, string>;
}
