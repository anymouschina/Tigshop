// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsInt,
  MaxLength,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class CategoryQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number = 0;

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
  sort_field?: string = "category_id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "asc";

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  paging?: boolean = true;
}

export class CategoryDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateCategoryDto {
  @IsString()
  @MaxLength(30)
  category_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  short_name?: string = "";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number = 0;

  @IsOptional()
  @IsString()
  category_pic?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category_ico?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(15)
  measure_unit?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seo_title?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search_keywords?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  keywords?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  category_desc?: string = "";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  is_hot?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  is_show?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number = 50;
}

export class UpdateCategoryDto {
  @IsNumber()
  @Type(() => Number)
  category_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  category_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  short_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number;

  @IsOptional()
  @IsString()
  category_pic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category_ico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  measure_unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seo_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search_keywords?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  keywords?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  category_desc?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  is_hot?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  is_show?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class UpdateCategoryFieldDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteCategoryDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteCategoryDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class MoveCategoryDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNumber()
  @Type(() => Number)
  target_category_id: number;
}

export class GetParentNameDto {
  @IsNumber()
  @Type(() => Number)
  parent_id: number;
}
