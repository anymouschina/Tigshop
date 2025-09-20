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

export class BrandQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  first_word?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-1)
  @Max(1)
  is_show?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-1)
  @Max(1)
  brand_is_hot?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-1)
  @Max(2)
  status?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  shop_id?: number = 0;

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
  sort_field?: string = "brand_id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  paging?: boolean = true;
}

export class BrandDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateBrandDto {
  @IsString()
  @MaxLength(30)
  brand_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  first_word?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand_type?: string = "";

  @IsOptional()
  @IsString()
  brand_desc?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand_logo?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_url?: string = "";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  brand_is_hot?: number = 0;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  shop_id?: number = 0;
}

export class UpdateBrandDto {
  @IsNumber()
  @Type(() => Number)
  brand_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  brand_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  first_word?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand_type?: string;

  @IsOptional()
  @IsString()
  brand_desc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand_logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  brand_is_hot?: number;

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

export class UpdateBrandFieldDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteBrandDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteBrandDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class SearchBrandDto {
  @IsOptional()
  @IsString()
  word?: string = "";
}

export class AuditBrandDto {
  @IsNumber()
  @Type(() => Number)
  brand_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(2)
  status: number; // 0:待审核, 1:审核通过, 2:已拒绝

  @IsOptional()
  @IsString()
  reject_remark?: string = "";
}

export class AuditBrandQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  shop_id?: number = 0;

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
  sort_field?: string = "brand_id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";
}
