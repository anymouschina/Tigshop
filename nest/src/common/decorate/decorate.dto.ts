import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum DECORATE_TYPE {
  HOME = 1,
  CATEGORY = 2,
  CART = 3,
  USER = 4,
  PRODUCT = 5,
}

export enum DECORATE_STATUS {
  DISABLED = 0,
  ENABLED = 1,
}

export enum DECORATE_PLATFORM {
  H5 = "h5",
  APP = "app",
  PC = "pc",
  MINI_PROGRAM = "mini_program",
}

export class DecorateQueryDto {
  @ApiProperty({ description: "关键词搜索", required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: "装修类型", required: false })
  @IsOptional()
  @IsEnum(DECORATE_TYPE)
  type?: DECORATE_TYPE;

  @ApiProperty({ description: "平台", required: false })
  @IsOptional()
  @IsEnum(DECORATE_PLATFORM)
  platform?: DECORATE_PLATFORM;

  @ApiProperty({ description: "状态", required: false })
  @IsOptional()
  @IsEnum(DECORATE_STATUS)
  status?: DECORATE_STATUS;

  @ApiProperty({ description: "页码", required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false })
  @IsOptional()
  @IsNumber()
  size?: number = 10;

  @ApiProperty({ description: "排序字段", required: false })
  @IsOptional()
  @IsString()
  sort_field?: string;

  @ApiProperty({ description: "排序方式", required: false })
  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc";
}

export class DecorateDetailDto {
  @ApiProperty({ description: "装修ID" })
  @IsNumber()
  id: number;
}

export class CreateDecorateDto {
  @ApiProperty({ description: "装修标题" })
  @IsString()
  decorate_title: string;

  @ApiProperty({ description: "装修数据" })
  @IsString()
  data: string;

  @ApiProperty({ description: "草稿数据", required: false })
  @IsOptional()
  @IsString()
  draft_data?: string;

  @ApiProperty({ description: "装修类型" })
  @IsEnum(DECORATE_TYPE)
  decorate_type: DECORATE_TYPE;

  @ApiProperty({ description: "是否首页" })
  @IsOptional()
  @IsNumber()
  is_home?: number = 0;

  @ApiProperty({ description: "店铺ID" })
  @IsOptional()
  @IsNumber()
  shop_id?: number = 0;

  @ApiProperty({ description: "状态" })
  @IsOptional()
  @IsBoolean()
  status?: boolean = false;

  @ApiProperty({ description: "语言ID" })
  @IsOptional()
  @IsNumber()
  locale_id?: number = 0;

  @ApiProperty({ description: "父级ID" })
  @IsOptional()
  @IsNumber()
  parent_id?: number = 0;
}

export class UpdateDecorateDto {
  @ApiProperty({ description: "装修ID" })
  @IsNumber()
  id: number;

  @ApiProperty({ description: "装修标题", required: false })
  @IsOptional()
  @IsString()
  decorate_title?: string;

  @ApiProperty({ description: "装修数据", required: false })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiProperty({ description: "草稿数据", required: false })
  @IsOptional()
  @IsString()
  draft_data?: string;

  @ApiProperty({ description: "装修类型", required: false })
  @IsOptional()
  @IsEnum(DECORATE_TYPE)
  decorate_type?: DECORATE_TYPE;

  @ApiProperty({ description: "是否首页", required: false })
  @IsOptional()
  @IsNumber()
  is_home?: number;

  @ApiProperty({ description: "店铺ID", required: false })
  @IsOptional()
  @IsNumber()
  shop_id?: number;

  @ApiProperty({ description: "状态", required: false })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiProperty({ description: "语言ID", required: false })
  @IsOptional()
  @IsNumber()
  locale_id?: number;

  @ApiProperty({ description: "父级ID", required: false })
  @IsOptional()
  @IsNumber()
  parent_id?: number;
}

export class DeleteDecorateDto {
  @ApiProperty({ description: "装修ID" })
  @IsNumber()
  id: number;
}

export class BatchDeleteDecorateDto {
  @ApiProperty({ description: "装修ID列表", type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
