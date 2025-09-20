// @ts-nocheck
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsEmail,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateAddressDto {
  @ApiProperty({ description: "收件人姓名" })
  @IsNotEmpty({ message: "收件人姓名不能为空" })
  @IsString({ message: "收件人姓名格式不正确" })
  consignee: string;

  @ApiProperty({ description: "手机号码" })
  @IsNotEmpty({ message: "手机号码不能为空" })
  @IsString({ message: "手机号码格式不正确" })
  mobile: string;

  @ApiProperty({ description: "固定电话", required: false })
  @IsOptional()
  @IsString({ message: "固定电话格式不正确" })
  telephone?: string;

  @ApiProperty({ description: "地区ID数组" })
  @IsNotEmpty({ message: "地区ID不能为空" })
  @IsArray({ message: "地区ID必须为数组" })
  @IsInt({ each: true, message: "地区ID必须为整数" })
  region_ids: number[];

  @ApiProperty({ description: "地区名称数组" })
  @IsNotEmpty({ message: "地区名称不能为空" })
  @IsArray({ message: "地区名称必须为数组" })
  @IsString({ each: true, message: "地区名称必须为字符串" })
  region_names: string[];

  @ApiProperty({ description: "详细地址" })
  @IsNotEmpty({ message: "详细地址不能为空" })
  @IsString({ message: "详细地址格式不正确" })
  address: string;

  @ApiProperty({ description: "邮政编码", required: false })
  @IsOptional()
  @IsString({ message: "邮政编码格式不正确" })
  postcode?: string;

  @ApiProperty({ description: "邮箱", required: false })
  @IsOptional()
  @IsEmail({}, { message: "邮箱格式不正确" })
  email?: string;

  @ApiProperty({ description: "地址标签", required: false })
  @IsOptional()
  @IsString({ message: "地址标签格式不正确" })
  address_tag?: string;

  @ApiProperty({ description: "是否为默认地址", required: false, default: 0 })
  @IsOptional()
  @IsEnum({ 0: 0, 1: 1 }, { message: "是否为默认地址格式不正确" })
  is_default?: 0 | 1 = 0;
}

export class UpdateAddressDto extends CreateAddressDto {
  @ApiProperty({ description: "地址ID" })
  @IsNotEmpty({ message: "地址ID不能为空" })
  @IsInt({ message: "地址ID必须为整数" })
  id: number;
}

export class AddressListDto {
  @ApiProperty({ description: "页码", required: false, default: 1 })
  @IsOptional()
  @IsInt({ message: "页码必须为整数" })
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false, default: 15 })
  @IsOptional()
  @IsInt({ message: "每页数量必须为整数" })
  size?: number = 15;
}

export class AddressDetailDto {
  @ApiProperty({ description: "地址ID" })
  @IsNotEmpty({ message: "地址ID不能为空" })
  @IsInt({ message: "地址ID必须为整数" })
  id: number;
}

export class SetDefaultAddressDto {
  @ApiProperty({ description: "地址ID" })
  @IsNotEmpty({ message: "地址ID不能为空" })
  @IsInt({ message: "地址ID必须为整数" })
  id: number;
}

export class DeleteAddressDto {
  @ApiProperty({ description: "地址ID" })
  @IsNotEmpty({ message: "地址ID不能为空" })
  @IsInt({ message: "地址ID必须为整数" })
  id: number;
}

export class AddressListResponse {
  @ApiProperty({ description: "地址列表" })
  records: any[];

  @ApiProperty({ description: "总数量" })
  total: number;
}

export class AddressResponse {
  @ApiProperty({ description: "地址详情" })
  address: any;

  @ApiProperty({ description: "消息" })
  message?: string;
}

export class SuccessResponse {
  @ApiProperty({ description: "消息" })
  message?: string;

  @ApiProperty({ description: "地址ID" })
  address_id?: number;
}
