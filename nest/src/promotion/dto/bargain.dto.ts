// @ts-nocheck
import { IsOptional, IsString, IsNumber, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class BargainQueryDto {
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
  sort_field?: string = 'bargain_id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = 0;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_show?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((date: string) => date.trim());
    }
    return value;
  })
  add_time?: string[];
}

export class BargainDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateBargainDto {
  @IsString()
  bargain_name: string;

  @IsOptional()
  @IsString()
  bargain_pic?: string = '';

  @IsNumber()
  @Type(() => Number)
  product_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sku_id?: number = 0;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  product_price: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  cut_price_limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cut_num_limit?: number = 1;

  @IsOptional()
  @IsString()
  first_cut_range?: string = '0.01-0.10';

  @IsOptional()
  @IsString()
  cut_range?: string = '0.01-0.05';

  @IsNumber()
  @Type(() => Number)
  start_time: number;

  @IsNumber()
  @Type(() => Number)
  end_time: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = 1;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_show?: boolean = true;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number = 0;
}

export class UpdateBargainDto {
  @IsNumber()
  @Type(() => Number)
  bargain_id: number;

  @IsOptional()
  @IsString()
  bargain_name?: string;

  @IsOptional()
  @IsString()
  bargain_pic?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sku_id?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  product_price?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  cut_price_limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  cut_num_limit?: number;

  @IsOptional()
  @IsString()
  first_cut_range?: string;

  @IsOptional()
  @IsString()
  cut_range?: string;

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
  @IsBoolean()
  @Type(() => Boolean)
  is_show?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;
}

export class UpdateBargainFieldDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteBargainDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteBargainDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
