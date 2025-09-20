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
  IsDate,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class AuthorityQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
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
  sort_field?: string = "id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "asc";
}

export class AuthorityDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateAuthorityDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @MaxLength(100)
  code: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
  type?: number = 0;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  component?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string = "";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number = 1;
}

export class UpdateAuthorityDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
  type?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  component?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;
}

export class DeleteAuthorityDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteAuthorityDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const AUTHORITY_TYPE = {
  0: "菜单",
  1: "操作",
  2: "按钮",
};

export const AUTHORITY_STATUS = {
  0: "禁用",
  1: "启用",
};
