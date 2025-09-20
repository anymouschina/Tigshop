// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ProductIntroType } from "./create-product.dto";

export class ProductQueryDto {
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
  @Max(100)
  size?: number = 15;

  @ApiProperty({
    description: "排序字段",
    required: false,
    default: "productId",
  })
  @IsOptional()
  @IsString()
  sortField?: string = "productId";

  @ApiProperty({
    description: "排序方向",
    required: false,
    default: "desc",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";

  @ApiProperty({ description: "商品ID", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  productId?: number;

  @ApiProperty({ description: "是否删除", required: false, default: -1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  isDelete?: number = -1;

  @ApiProperty({ description: "分类ID", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiProperty({ description: "品牌ID", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  brandId?: number;

  @ApiProperty({ description: "店铺ID", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shopId?: number = -2;

  @ApiProperty({
    description: "推荐类型",
    required: false,
    enum: ProductIntroType,
  })
  @IsOptional()
  @IsEnum(ProductIntroType)
  introType?: ProductIntroType;

  @ApiProperty({ description: "是否启用", required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 1 || value === "true")
  isEnable?: boolean;

  @ApiProperty({ description: "是否精选", required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 1 || value === "true")
  isBest?: boolean;

  @ApiProperty({ description: "是否新品", required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 1 || value === "true")
  isNew?: boolean;

  @ApiProperty({ description: "是否热卖", required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 1 || value === "true")
  isHot?: boolean;

  @ApiProperty({ description: "是否推荐", required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 1 || value === "true")
  isRecommend?: boolean;

  @ApiProperty({ description: "最低价格", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiProperty({ description: "最高价格", required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ description: "商品ID列表", required: false })
  @IsOptional()
  @IsString()
  ids?: string;
}
