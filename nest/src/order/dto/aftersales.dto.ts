// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsArray,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class AftersalesQueryDto {
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
  sort_field?: string = "aftersale_id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aftersale_type?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendor_id?: number = 0;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((date: string) => date.trim());
    }
    return value;
  })
  add_time?: string[];
}

export class AftersalesDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class UpdateAftersalesDto {
  @IsNumber()
  @Type(() => Number)
  aftersale_id: number;

  @IsNumber()
  @Type(() => Number)
  status: number;

  @IsOptional()
  @IsString()
  reply?: string = "";

  @IsOptional()
  @IsString()
  return_address?: string = "";

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  refund_amount?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  admin_id?: number = 0;
}

export class CompleteAftersalesDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNumber()
  @Type(() => Number)
  admin_id: number;
}
