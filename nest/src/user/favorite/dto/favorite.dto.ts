// @ts-nocheck
import { IsNumber, IsOptional, IsBoolean, IsEnum, IsString, IsArray } from 'class-validator';

export enum FavoriteType {
  PRODUCT = 'product',
  SHOP = 'shop',
  ARTICLE = 'article',
}

export class CreateFavoriteDto {
  @IsNumber()
  targetId: number;

  @IsEnum(FavoriteType)
  type: FavoriteType;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class GetFavoritesDto {
  @IsEnum(FavoriteType)
  @IsOptional()
  type?: FavoriteType;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  size?: number;
}

export class UpdateFavoriteDto {
  @IsString()
  @IsOptional()
  remark?: string;
}

export class FavoriteBatchDto {
  @IsArray()
  targetIds: number[];

  @IsEnum(FavoriteType)
  type: FavoriteType;
}

export class CheckFavoriteDto {
  @IsNumber()
  targetId: number;

  @IsEnum(FavoriteType)
  type: FavoriteType;
}
