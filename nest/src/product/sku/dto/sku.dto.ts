// @ts-nocheck
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SkuAttributeDto {
  @IsString()
  name: string;

  @IsString()
  value: string;
}

export class CreateSkuDto {
  @IsNumber()
  productId: number;

  @IsString()
  skuCode: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  originalPrice: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @IsOptional()
  skuImage?: string;

  @IsString()
  @IsOptional()
  skuName?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuAttributeDto)
  attributes: SkuAttributeDto[];
}

export class UpdateSkuDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  skuImage?: string;

  @IsString()
  @IsOptional()
  skuName?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuAttributeDto)
  @IsOptional()
  attributes?: SkuAttributeDto[];

  @IsBoolean()
  @IsOptional()
  isEnable?: boolean;
}

export class GetSkusDto {
  @IsNumber()
  @IsOptional()
  productId?: number;

  @IsString()
  @IsOptional()
  skuCode?: string;

  @IsBoolean()
  @IsOptional()
  isEnable?: boolean;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  size?: number;
}

export class SkuStockUpdateDto {
  @IsNumber()
  @Min(0)
  stock: number;
}

export class SkuBatchStockUpdateDto {
  @IsArray()
  skuUpdates: {
    skuId: number;
    stock: number;
  }[];
}

export class SkuAvailabilityDto {
  @IsArray()
  skuIds: number[];
}

export class SkuPriceUpdateDto {
  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;
}
