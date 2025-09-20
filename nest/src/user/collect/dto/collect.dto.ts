// @ts-nocheck
import { IsNotEmpty, IsInt, IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CollectType {
  PRODUCT = 'product',
  SHOP = 'shop',
  ARTICLE = 'article',
}

export class CollectListDto {
  @ApiProperty({ description: '关键词搜索', required: false })
  @IsOptional()
  @IsString({ message: '关键词格式不正确' })
  keyword?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsInt({ message: '页码必须为整数' })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 15 })
  @IsOptional()
  @IsInt({ message: '每页数量必须为整数' })
  size?: number = 15;

  @ApiProperty({ description: '排序字段', required: false, default: 'collect_id' })
  @IsOptional()
  @IsString({ message: '排序字段格式不正确' })
  sort_field?: string = 'collect_id';

  @ApiProperty({ description: '排序方式', required: false, default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方式不正确' })
  sort_order?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: '收藏类型', required: false })
  @IsOptional()
  @IsEnum(CollectType, { message: '收藏类型不正确' })
  collect_type?: CollectType;
}

export class CreateCollectDto {
  @ApiProperty({ description: '收藏类型' })
  @IsEnum(CollectType, { message: '收藏类型不正确' })
  collect_type: CollectType;

  @ApiProperty({ description: '目标ID' })
  @IsNotEmpty({ message: '目标ID不能为空' })
  @IsInt({ message: '目标ID必须为整数' })
  target_id: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString({ message: '备注格式不正确' })
  remark?: string;
}

export class UpdateCollectDto {
  @ApiProperty({ description: '收藏ID' })
  @IsNotEmpty({ message: '收藏ID不能为空' })
  @IsInt({ message: '收藏ID必须为整数' })
  id: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString({ message: '备注格式不正确' })
  remark?: string;
}

export class DeleteCollectDto {
  @ApiProperty({ description: '收藏ID' })
  @IsNotEmpty({ message: '收藏ID不能为空' })
  @IsInt({ message: '收藏ID必须为整数' })
  id: number;
}

export class BatchDeleteCollectDto {
  @ApiProperty({ description: '收藏ID数组' })
  @IsNotEmpty({ message: '收藏ID数组不能为空' })
  @IsArray({ message: '收藏ID必须为数组' })
  @IsInt({ each: true, message: '收藏ID必须为整数' })
  ids: number[];
}

export class CollectProductDto {
  @ApiProperty({ description: '商品ID' })
  @IsNotEmpty({ message: '商品ID不能为空' })
  @IsInt({ message: '商品ID必须为整数' })
  product_id: number;
}

export class CheckCollectDto {
  @ApiProperty({ description: '目标ID' })
  @IsNotEmpty({ message: '目标ID不能为空' })
  @IsInt({ message: '目标ID必须为整数' })
  target_id: number;

  @ApiProperty({ description: '收藏类型', required: false })
  @IsOptional()
  @IsEnum(CollectType, { message: '收藏类型不正确' })
  collect_type?: CollectType = CollectType.PRODUCT;
}

export class CollectListResponse {
  @ApiProperty({ description: '收藏列表' })
  records: any[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

export class CollectResponse {
  @ApiProperty({ description: '收藏详情' })
  collect: any;

  @ApiProperty({ description: '消息' })
  message?: string;
}

export class SuccessResponse {
  @ApiProperty({ description: '消息' })
  message?: string;

  @ApiProperty({ description: '收藏ID' })
  collect_id?: number;
}

export class CheckCollectResponse {
  @ApiProperty({ description: '是否已收藏' })
  is_collected: boolean;

  @ApiProperty({ description: '收藏ID', required: false })
  collect_id?: number;
}
