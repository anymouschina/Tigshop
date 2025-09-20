// @ts-nocheck
import { IsNumber, IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum ShareChannel {
  WECHAT = 'wechat',
  WECHAT_MOMENTS = 'wechat_moments',
  QQ = 'qq',
  WEIBO = 'weibo',
  DOUYIN = 'douyin',
}

export enum ShareType {
  PRODUCT = 'product',
  ORDER = 'order',
  SHOP = 'shop',
}

export class ShareProductDto {
  @IsNumber()
  product_id: number;

  @IsOptional()
  @IsEnum(ShareChannel)
  channel?: ShareChannel = ShareChannel.WECHAT;
}

export class ShareOrderDto {
  @IsNumber()
  order_id: number;

  @IsOptional()
  @IsEnum(ShareChannel)
  channel?: ShareChannel = ShareChannel.WECHAT;
}

export class ShareShopDto {
  @IsNumber()
  shop_id: number;

  @IsOptional()
  @IsEnum(ShareChannel)
  channel?: ShareChannel = ShareChannel.WECHAT;
}

export class CustomContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class GenerateShareDto {
  @IsEnum(ShareType)
  type: ShareType;

  @IsNumber()
  target_id: number;

  @IsOptional()
  @IsEnum(ShareChannel)
  channel?: ShareChannel = ShareChannel.WECHAT;

  @IsOptional()
  @IsObject()
  custom_content?: CustomContentDto;
}

export class ShareStatsDto {
  @IsNumber()
  share_id: number;
}
