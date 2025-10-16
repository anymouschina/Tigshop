import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsEmail,
  IsArray,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

const normalizeArray = (input: unknown): unknown[] => {
  if (Array.isArray(input)) {
    return input;
  }
  if (typeof input === "string") {
    return input
      .split(/[\s,，,]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (input == null) {
    return [];
  }
  return [input];
};

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

  @ApiProperty({ description: "地区ID数组（驼峰）" })
  @IsNotEmpty({ message: "地区ID不能为空" })
  @IsArray({ message: "地区ID必须为数组" })
  @IsInt({ each: true, message: "地区ID必须为整数" })
  @Transform(({ value, obj }) => {
    const candidate =
      value ??
      obj?.regionIds ??
      obj?.region_ids ??
      obj?.ids ??
      obj?.regionIdList;
    return normalizeArray(candidate)
      .map((item) => Number(String(item).trim()))
      .filter((n) => Number.isInteger(n));
  })
  regionIds: number[];

  @ApiProperty({ description: "地区名称数组（驼峰）" })
  @IsNotEmpty({ message: "地区名称不能为空" })
  @IsArray({ message: "地区名称必须为数组" })
  @IsString({ each: true, message: "地区名称必须为字符串" })
  @Transform(({ value, obj }) => {
    const candidate =
      value ??
      obj?.regionNames ??
      obj?.region_names ??
      obj?.regionFullName ??
      obj?.regionName ??
      obj?.regionNameList;
    return normalizeArray(candidate).map((item) => String(item));
  })
  regionNames: string[];

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
  @Transform(({ value, obj }) => {
    const candidate = value ?? obj?.addressTag ?? obj?.address_tag ?? obj?.tag;
    return candidate != null ? String(candidate) : undefined;
  })
  addressTag?: string;

  @ApiProperty({
    description: "是否为默认地址（驼峰）",
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsEnum({ 0: 0, 1: 1 }, { message: "是否为默认地址格式不正确" })
  @Transform(({ value, obj }) => {
    const candidate = value ?? obj?.isDefault ?? obj?.is_default;
    if (candidate === true) return 1;
    if (candidate === false) return 0;
    if (candidate === 0 || candidate === 1) return candidate as 0 | 1;
    if (candidate === "0" || candidate === "1")
      return Number(candidate) as 0 | 1;
    return 0;
  })
  isDefault?: 0 | 1 = 0;
}

export class UpdateAddressDto extends CreateAddressDto {
  @ApiProperty({ description: "地址ID" })
  @IsNotEmpty({ message: "地址ID不能为空" })
  @IsInt({ message: "地址ID必须为整数" })
  @Type(() => Number)
  id: number;
}

export class AddressListDto {
  @ApiProperty({ description: "页码", required: false, default: 1 })
  @IsOptional()
  @IsInt({ message: "页码必须为整数" })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false, default: 15 })
  @IsOptional()
  @IsInt({ message: "每页数量必须为整数" })
  @Type(() => Number)
  size?: number = 15;
}

export class AddressDetailDto {
  @ApiProperty({ description: "地址ID" })
  @IsNotEmpty({ message: "地址ID不能为空" })
  @IsInt({ message: "地址ID必须为整数" })
  @Type(() => Number)
  id: number;
}

export class SetDefaultAddressDto {
  @ApiProperty({ description: "地址ID" })
  @IsNotEmpty({ message: "地址ID不能为空" })
  @IsInt({ message: "地址ID必须为整数" })
  @Type(() => Number)
  id: number;
}

export class DeleteAddressDto {
  @ApiProperty({ description: "地址ID" })
  @IsNotEmpty({ message: "地址ID不能为空" })
  @IsInt({ message: "地址ID必须为整数" })
  @Type(() => Number)
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
