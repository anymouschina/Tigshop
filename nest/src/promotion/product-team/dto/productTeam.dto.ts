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

export enum ProductTeamStatus {
  PENDING = 0, // 待审核
  ACTIVE = 1, // 激活
  ENDED = 2, // 已结束
  CANCELLED = 3, // 已取消
}

export class ProductTeamQueryDto {
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
    enum: ProductTeamStatus,
  })
  @IsOptional()
  @IsEnum(ProductTeamStatus)
  status?: ProductTeamStatus;

  @ApiProperty({ description: "排序字段", required: false, default: "team_id" })
  @IsOptional()
  @IsString()
  sortField?: string = "team_id";

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

export class CreateProductTeamDto {
  @ApiProperty({ description: "团购价格" })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0)
  TeamPrice: number;

  @ApiProperty({ description: "最小人数" })
  @IsNotEmpty()
  @Type(() => Number)
  MinPeople: number;

  @ApiProperty({ description: "最大人数" })
  @IsNotEmpty()
  @Type(() => Number)
  MaxPeople: number;

  @ApiProperty({ description: "开始时间" })
  @IsNotEmpty()
  @IsString()
  StartTime: string;

  @ApiProperty({ description: "结束时间" })
  @IsNotEmpty()
  @IsString()
  EndTime: string;
}

export class UpdateProductTeamDto {
  @ApiProperty({ description: "团购价格", required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  TeamPrice?: number;

  @ApiProperty({ description: "最小人数", required: false })
  @IsOptional()
  @Type(() => Number)
  MinPeople?: number;

  @ApiProperty({ description: "最大人数", required: false })
  @IsOptional()
  @Type(() => Number)
  MaxPeople?: number;

  @ApiProperty({ description: "开始时间", required: false })
  @IsOptional()
  @IsString()
  StartTime?: string;

  @ApiProperty({ description: "结束时间", required: false })
  @IsOptional()
  @IsString()
  EndTime?: string;

  @ApiProperty({ description: "status", required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;
}

export class ProductTeamConfigDto {
  @ApiProperty({ description: "状态配置" })
  statusConfig: Record<string, string>;
}
