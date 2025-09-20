// @ts-nocheck
import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsMobilePhone,
  MaxLength,
  MinLength,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class AddressQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  size?: number = 20;
}

export class CreateAddressDto {
  @IsString()
  @MaxLength(20, { message: "收货人姓名不能超过20个字符" })
  name: string;

  @IsMobilePhone("zh-CN", { message: "手机号格式不正确" })
  mobile: string;

  @IsNumber()
  province_id: number;

  @IsNumber()
  city_id: number;

  @IsOptional()
  @IsNumber()
  district_id?: number;

  @IsString()
  @MaxLength(200, { message: "详细地址不能超过200个字符" })
  address: string;

  @IsOptional()
  @Transform(({ value }) => (value ? 1 : 0))
  @IsBoolean()
  is_default?: number = 0;
}

export class UpdateAddressDto {
  @IsNumber()
  address_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: "收货人姓名不能超过20个字符" })
  name?: string;

  @IsOptional()
  @IsMobilePhone("zh-CN", { message: "手机号格式不正确" })
  mobile?: string;

  @IsOptional()
  @IsNumber()
  province_id?: number;

  @IsOptional()
  @IsNumber()
  city_id?: number;

  @IsOptional()
  @IsNumber()
  district_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "详细地址不能超过200个字符" })
  address?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? 1 : 0))
  @IsBoolean()
  is_default?: number;
}

export class SetSelectedDto {
  @IsNumber()
  address_id: number;
}

export class AddressRegionDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parent_id?: number = 0;
}
