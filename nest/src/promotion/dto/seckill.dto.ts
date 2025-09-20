// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsBoolean,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class SeckillQueryDto {
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
  sort_field?: string = "seckill_id";

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
  shop_id?: number = 0;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((date: string) => date.trim());
    }
    return value;
  })
  add_time?: string[];
}

export class SeckillDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateSeckillDto {
  @IsString()
  seckill_name: string;

  @IsOptional()
  @IsString()
  seckill_remark?: string = "";

  @IsNumber()
  @Type(() => Number)
  start_time: number;

  @IsNumber()
  @Type(() => Number)
  end_time: number;

  @IsNumber()
  @Type(() => Number)
  shop_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number = 0;

  @IsOptional()
  @IsArray()
  items?: SeckillItemDto[];
}

export class UpdateSeckillDto {
  @IsNumber()
  @Type(() => Number)
  seckill_id: number;

  @IsOptional()
  @IsString()
  seckill_name?: string;

  @IsOptional()
  @IsString()
  seckill_remark?: string;

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
  @IsNumber()
  shop_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsArray()
  items?: SeckillItemDto[];
}

export class SeckillItemDto {
  @IsNumber()
  @Type(() => Number)
  item_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  seckill_price: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  seckill_stock: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  limit_num?: number = 0;
}

export class UpdateSeckillFieldDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteSeckillDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteSeckillDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
