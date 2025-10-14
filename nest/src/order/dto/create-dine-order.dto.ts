// @ts-nocheck
import { IsInt, IsOptional, IsString, IsIn, Min, ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// 2 = DINE_IN, 3 = TAKEOUT (复用 order_type)
class DineOrderItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsInt()
  skuId?: number;
}

export class CreateDineOrderDto {
  @IsInt()
  @IsIn([2, 3])
  orderType: number;

  @IsOptional()
  @IsString()
  tableNo?: string; // 堂食必填

  @IsOptional()
  @IsInt()
  @Min(1)
  peopleCount?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DineOrderItemDto)
  @ArrayMinSize(1)
  items?: DineOrderItemDto[]; // 预留
}
