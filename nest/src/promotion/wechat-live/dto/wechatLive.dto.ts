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

export enum WechatLiveStatus {
  PENDING = 0, // 待审核
  LIVE = 1, // 直播中
  ENDED = 2, // 已结束
}

export class WechatLiveQueryDto {
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

  @ApiProperty({ description: "状态", required: false, enum: WechatLiveStatus })
  @IsOptional()
  @IsEnum(WechatLiveStatus)
  status?: WechatLiveStatus;

  @ApiProperty({ description: "排序字段", required: false, default: "live_id" })
  @IsOptional()
  @IsString()
  sortField?: string = "live_id";

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

export class CreateWechatLiveDto {
  @ApiProperty({ description: "标题" })
  @IsNotEmpty()
  @IsString()
  Title: string;

  @ApiProperty({ description: "开始时间" })
  @IsNotEmpty()
  @IsString()
  StartTime: string;

  @ApiProperty({ description: "结束时间" })
  @IsNotEmpty()
  @IsString()
  EndTime: string;

  @ApiProperty({ description: "封面图片" })
  @IsNotEmpty()
  @IsString()
  CoverImage: string;
}

export class UpdateWechatLiveDto {
  @ApiProperty({ description: "标题", required: false })
  @IsOptional()
  @IsString()
  Title?: string;

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

  @ApiProperty({ description: "封面图片", required: false })
  @IsOptional()
  @IsString()
  CoverImage?: string;
}

export class WechatLiveConfigDto {
  @ApiProperty({ description: "状态配置" })
  statusConfig: Record<string, string>;
}
