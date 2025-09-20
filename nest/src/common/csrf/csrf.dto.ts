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

export class CsrfQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
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
  sort_order?: "asc" | "desc" = "desc";
}

export class CsrfDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateCsrfDto {
  @IsString()
  @MaxLength(255)
  token: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  user_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
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
  description?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ip?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  user_agent?: string = "";

  @IsOptional()
  @Type(() => Date)
  expires_at?: Date;

  @IsOptional()
  @Type(() => Boolean)
  used?: boolean = false;
}

export class UpdateCsrfDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  token?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
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
  @IsString()
  @MaxLength(45)
  ip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  user_agent?: string;

  @IsOptional()
  @Type(() => Date)
  expires_at?: Date;

  @IsOptional()
  @Type(() => Boolean)
  used?: boolean;
}

export class DeleteCsrfDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteCsrfDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const CSRF_TYPE = {
  0: "表单提交",
  1: "API调用",
  2: "文件上传",
  3: "删除操作",
  4: "修改操作",
  5: "其他操作",
};

export const CSRF_STATUS = {
  0: "禁用",
  1: "启用",
};
