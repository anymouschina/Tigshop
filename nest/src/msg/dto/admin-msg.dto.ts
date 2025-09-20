// @ts-nocheck
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AdminMsgQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  msg_type?: number = 11;

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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return { msg_id: 'desc' };
      }
    }
    return value || { msg_id: 'desc' };
  })
  sort_field?: any = { is_readed: 'asc', msg_id: 'desc' };

  @IsOptional()
  @IsString()
  sort_order?: string = '';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = -2;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  suppliers_type?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  is_read?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  suppliers_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendor_id?: number;
}

export class SetReadedDto {
  @IsNumber()
  @Type(() => Number)
  msg_id: number;
}

export class SetAllReadedDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendor_id?: number = 0;
}

export class GetMsgCountDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  start_time?: number = 0;
}

export class CreateAdminMsgDto {
  @IsNumber()
  msg_type: number;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shop_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  admin_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendor_id?: number = 0;

  @IsOptional()
  @IsString()
  msg_link?: string = '';

  @IsOptional()
  related_data?: any;
}
