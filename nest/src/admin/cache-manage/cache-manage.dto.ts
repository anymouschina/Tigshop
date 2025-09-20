// @ts-nocheck
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsInt, MaxLength, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CacheManageQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  type?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 15;

  @IsOptional()
  @IsString()
  sort_field?: string = 'id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class CacheManageDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateCacheManageDto {
  @IsString()
  @MaxLength(100)
  key: string;

  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  type?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number = 1;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string = '';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ttl?: number = 3600;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  prefix?: string = '';
}

export class UpdateCacheManageDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  type?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ttl?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  prefix?: string;
}

export class DeleteCacheManageDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteCacheManageDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const CACHE_TYPE = {
  0: '系统缓存',
  1: '用户缓存',
  2: '商品缓存',
  3: '订单缓存',
  4: '配置缓存',
  5: '页面缓存',
  6: '接口缓存',
  7: '统计缓存',
  8: '日志缓存',
  9: '其他缓存',
  10: '临时缓存',
};

export const CACHE_STATUS = {
  0: '禁用',
  1: '启用',
};
