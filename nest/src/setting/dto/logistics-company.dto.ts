import { IsOptional, IsString, IsNumber, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class LogisticsCompanyQueryDto {
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
  sort_field?: string = 'logistics_id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  logistics_id?: number = 0;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  paging?: boolean = true;
}

export class LogisticsCompanyDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateLogisticsCompanyDto {
  @IsString()
  logistics_name: string;

  @IsString()
  logistics_code: string;

  @IsOptional()
  @IsString()
  logistics_desc?: string = '';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_show?: boolean = true;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort_order?: number = 50;

  @IsOptional()
  @IsString()
  customer_name?: string = '';

  @IsOptional()
  @IsString()
  customer_pwd?: string = '';

  @IsOptional()
  @IsString()
  month_code?: string = '';

  @IsOptional()
  @IsString()
  send_site?: string = '';

  @IsOptional()
  @IsString()
  send_staff?: string = '';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exp_type?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = 1;
}

export class UpdateLogisticsCompanyDto {
  @IsNumber()
  @Type(() => Number)
  logistics_id: number;

  @IsOptional()
  @IsString()
  logistics_name?: string;

  @IsOptional()
  @IsString()
  logistics_code?: string;

  @IsOptional()
  @IsString()
  logistics_desc?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_show?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsString()
  customer_pwd?: string;

  @IsOptional()
  @IsString()
  month_code?: string;

  @IsOptional()
  @IsString()
  send_site?: string;

  @IsOptional()
  @IsString()
  send_staff?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exp_type?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number;
}

export class UpdateLogisticsCompanyFieldDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteLogisticsCompanyDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteLogisticsCompanyDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}