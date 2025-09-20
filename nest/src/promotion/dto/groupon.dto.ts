// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class GrouponQueryDto {
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
  sort_field?: string = "product_team_id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = -1;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((date: string) => date.trim());
    }
    return value;
  })
  add_time?: string[];
}

export class GrouponDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateGrouponDto {
  @IsString()
  product_team_name: string;

  @IsNumber()
  @Type(() => Number)
  start_time: number;

  @IsNumber()
  @Type(() => Number)
  end_time: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit_num: number;

  @IsNumber()
  @Type(() => Number)
  product_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = 1;

  @IsArray()
  items: GrouponItemDto[];
}

export class UpdateGrouponDto {
  @IsNumber()
  @Type(() => Number)
  product_team_id: number;

  @IsOptional()
  @IsString()
  product_team_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  start_time?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  end_time?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit_num?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number;

  @IsOptional()
  @IsArray()
  items?: GrouponItemDto[];
}

export class GrouponItemDto {
  @IsNumber()
  @Type(() => Number)
  sku_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;
}

export class DeleteGrouponDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteGrouponDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
