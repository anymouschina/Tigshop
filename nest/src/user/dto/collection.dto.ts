// @ts-nocheck
import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CollectionType {
  PRODUCT = 'product',
  SHOP = 'shop',
}

export class CreateCollectionDto {
  @ApiProperty({ description: '收藏类型', enum: CollectionType })
  @IsEnum(CollectionType)
  type: CollectionType;

  @ApiProperty({ description: '收藏对象ID' })
  @IsInt()
  targetId: number;
}

export class QueryCollectionDto {
  @ApiProperty({ description: '收藏类型', enum: CollectionType, required: false })
  @IsOptional()
  @IsEnum(CollectionType)
  type?: CollectionType;

  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsInt()
  limit?: number = 10;
}
