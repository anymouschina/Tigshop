// @ts-nocheck
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ArticleQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 15;

  @IsOptional()
  @IsString()
  sort_field?: string = 'id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  category_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number = 1;
}

export class ArticleDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string = '';

  @IsString()
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  category_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number = 0;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_recommend?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number = 1;

  @IsOptional()
  @IsString()
  cover_image?: string = '';
}

export class UpdateArticleDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  category_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_recommend?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @IsOptional()
  @IsString()
  cover_image?: string;
}

export class DeleteArticleDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteArticleDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}