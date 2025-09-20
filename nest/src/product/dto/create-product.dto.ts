// @ts-nocheck
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, MaxLength, IsEnum } from 'class-validator';

export enum ProductIntroType {
  BEST = 'best',
  NEW = 'new',
  HOT = 'hot',
  RECOMMEND = 'recommend'
}

export class CreateProductDto {
  @ApiProperty({ description: '商品名称' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '商品副标题', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @ApiProperty({ description: '商品描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '商品价格' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: '市场价', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  marketPrice?: number;

  @ApiProperty({ description: '成本价', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiProperty({ description: '商品库存' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: '商品销量', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sales?: number;

  @ApiProperty({ description: '分类ID' })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ description: '品牌ID', required: false })
  @IsOptional()
  @IsNumber()
  brandId?: number;

  @ApiProperty({ description: '供应商ID', required: false })
  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @ApiProperty({ description: '店铺ID', required: false })
  @IsOptional()
  @IsNumber()
  shopId?: number;

  @ApiProperty({ description: '商品主图', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: '商品图片数组', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: '商品视频', required: false })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiProperty({ description: '视频封面', required: false })
  @IsOptional()
  @IsString()
  videoCover?: string;

  @ApiProperty({ description: '规格类型：0单规格，1多规格' })
  @IsNumber()
  @Min(0)
  @Max(1)
  specType: number = 0;

  @ApiProperty({ description: '重量(kg)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({ description: '体积(m³)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiProperty({ description: '运费', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;

  @ApiProperty({ description: '最小购买数量' })
  @IsNumber()
  @Min(1)
  minBuy: number = 1;

  @ApiProperty({ description: '最大购买数量', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxBuy?: number;

  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiProperty({ description: 'SEO标题', required: false })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiProperty({ description: 'SEO关键词', required: false })
  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @ApiProperty({ description: 'SEO描述', required: false })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiProperty({ description: '排序' })
  @IsNumber()
  @Min(0)
  sort: number = 100;

  @ApiProperty({ description: '是否精选', required: false })
  @IsOptional()
  @IsBoolean()
  isBest?: boolean = false;

  @ApiProperty({ description: '是否新品', required: false })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean = false;

  @ApiProperty({ description: '是否热卖', required: false })
  @IsOptional()
  @IsBoolean()
  isHot?: boolean = false;

  @ApiProperty({ description: '是否推荐', required: false })
  @IsOptional()
  @IsBoolean()
  isRecommend?: boolean = false;

  @ApiProperty({ description: '商品规格', required: false })
  @IsOptional()
  @IsArray()
  specs?: CreateProductSpecDto[];

  @ApiProperty({ description: '商品属性', required: false })
  @IsOptional()
  @IsArray()
  attrs?: CreateProductAttrDto[];
}

export class CreateProductSpecDto {
  @ApiProperty({ description: '规格名称' })
  @IsString()
  specName: string;

  @ApiProperty({ description: '规格值' })
  @IsString()
  specValue: string;

  @ApiProperty({ description: '规格价格', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specPrice?: number;

  @ApiProperty({ description: '规格库存' })
  @IsNumber()
  @Min(0)
  specStock: number = 0;

  @ApiProperty({ description: 'SKU', required: false })
  @IsOptional()
  @IsString()
  specSku?: string;

  @ApiProperty({ description: '规格图片', required: false })
  @IsOptional()
  @IsString()
  specImage?: string;

  @ApiProperty({ description: '排序' })
  @IsNumber()
  @Min(0)
  sort: number = 0;
}

export class CreateProductAttrDto {
  @ApiProperty({ description: '属性名称' })
  @IsString()
  attrName: string;

  @ApiProperty({ description: '属性值' })
  @IsString()
  attrValue: string;

  @ApiProperty({ description: '排序' })
  @IsNumber()
  @Min(0)
  sort: number = 0;
}
