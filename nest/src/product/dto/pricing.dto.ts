// @ts-nocheck
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from "class-validator";

export class GetAvailabilityQueryDto {
  @ApiProperty({ description: "商品ID" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @ApiPropertyOptional({ description: "SKU ID" })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  skuId?: number;

  @ApiPropertyOptional({ description: "额外属性ID串" })
  @IsOptional()
  extraAttrIds?: string;
}

export class SkuItemDto {
  @ApiProperty({ description: "SKU ID" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skuId: number;

  @ApiProperty({ description: "数量" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  num: number;
}

export class GetProductAmountBodyDto {
  @ApiProperty({ description: "商品ID" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ type: [SkuItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuItemDto)
  skuItem: SkuItemDto[];
}

export class GetBatchAvailabilityQueryDto {
  @ApiProperty({ description: "SKU ID 列表，逗号分隔" })
  skuIds: string;
}

export class BatchPriceItemDto {
  @ApiProperty({ description: "商品ID" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ description: "SKU ID" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skuId: number;
}

export class GetPriceInBatchesBodyDto {
  @ApiProperty({ type: [BatchPriceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchPriceItemDto)
  products: BatchPriceItemDto[];
}
