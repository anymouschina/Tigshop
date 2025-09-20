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

export class OauthQueryDto {
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
  sort_field?: string = "id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";
}

export class OauthDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateOauthDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @MaxLength(100)
  app_id: string;

  @IsString()
  @MaxLength(255)
  app_secret: string;

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
  description?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  redirect_url?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  scope?: string = "";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expires_in?: number = 3600;
}

export class UpdateOauthDto {
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
  app_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  app_secret?: string;

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
  @IsString()
  @MaxLength(255)
  redirect_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  scope?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expires_in?: number;
}

export class DeleteOauthDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteOauthDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const OAUTH_TYPE = {
  0: "微信",
  1: "QQ",
  2: "微博",
  3: "支付宝",
  4: "钉钉",
  5: "企业微信",
  6: "GitHub",
  7: "Google",
  8: "Facebook",
  9: "Twitter",
  10: "其他",
};

export const OAUTH_STATUS = {
  0: "禁用",
  1: "启用",
};
