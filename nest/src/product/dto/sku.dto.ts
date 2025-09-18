import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, MaxLength, IsObject } from 'class-validator';

export class CreateSpecTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '模板描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: '店铺ID', required: false })
  @IsOptional()
  @IsNumber()
  shopId?: number;

  @ApiProperty({ description: '规格配置' })
  @IsArray()
  specs: CreateSpecTemplateSpecDto[];
}

export class CreateSpecTemplateSpecDto {
  @ApiProperty({ description: '规格名称' })
  @IsString()
  @MaxLength(50)
  specName: string;

  @ApiProperty({ description: '规格值数组' })
  @IsArray()
  @IsString({ each: true })
  specValues: string[];

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sort?: number;
}

export class GenerateSkusDto {
  @ApiProperty({ description: '基础价格' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ description: '价格调整', required: false })
  @IsOptional()
  @IsArray()
  priceAdjustments?: PriceAdjustmentDto[];

  @ApiProperty({ description: '基础库存', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseStock?: number;

  @ApiProperty({ description: '库存分配', required: false })
  @IsOptional()
  @IsArray()
  stockAllocation?: StockAllocationDto[];

  @ApiProperty({ description: '是否生成SKU', required: false })
  @IsOptional()
  @IsBoolean()
  generateSkus?: boolean = true;
}

export class PriceAdjustmentDto {
  @ApiProperty({ description: '规格名称' })
  @IsString()
  specName: string;

  @ApiProperty({ description: '规格值' })
  @IsString()
  specValue: string;

  @ApiProperty({ description: '价格调整量' })
  @IsNumber()
  adjustment: number;
}

export class StockAllocationDto {
  @ApiProperty({ description: 'SKU编码' })
  @IsString()
  sku: string;

  @ApiProperty({ description: '库存数量' })
  @IsNumber()
  @Min(0)
  stock: number;
}

export class BatchUpdatePricesDto {
  @ApiProperty({ description: '价格更新数据' })
  @IsArray()
  updates: BatchPriceUpdateDto[];
}

export class BatchPriceUpdateDto {
  @ApiProperty({ description: '规格ID' })
  @IsNumber()
  specId: number;

  @ApiProperty({ description: '新价格' })
  @IsNumber()
  @Min(0)
  price: number;
}

export class BatchUpdateStockDto {
  @ApiProperty({ description: '库存更新数据' })
  @IsArray()
  updates: BatchStockUpdateDto[];
}

export class BatchStockUpdateDto {
  @ApiProperty({ description: '规格ID' })
  @IsNumber()
  specId: number;

  @ApiProperty({ description: '库存数量' })
  @IsNumber()
  stock: number;

  @ApiProperty({ description: '操作类型', required: false })
  @IsOptional()
  @IsString()
  operation?: 'set' | 'add' | 'subtract' = 'set';
}

export class SkuQueryDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsNumber()
  size?: number = 20;

  @ApiProperty({ description: '店铺ID', required: false })
  @IsOptional()
  @IsNumber()
  shopId?: number;

  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '最低价格', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ description: '最高价格', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ description: '库存状态', required: false })
  @IsOptional()
  @IsString()
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';

  @ApiProperty({ description: '排序字段', required: false })
  @IsOptional()
  @IsString()
  sortField?: string = 'createdAt';

  @ApiProperty({ description: '排序方向', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class SkuStockAlertDto {
  @ApiProperty({ description: '库存阈值', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  threshold?: number = 10;

  @ApiProperty({ description: '店铺ID', required: false })
  @IsOptional()
  @IsNumber()
  shopId?: number;
}