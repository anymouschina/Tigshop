import { IsNotEmpty, IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

export class CreateAddressDto {
  @ApiProperty({ description: '收件人姓名' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '手机号码' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: '省份' })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty({ description: '城市' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: '区县' })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({ description: '详细地址' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: '地址类型', enum: AddressType, required: false })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @ApiProperty({ description: '是否为默认地址', required: false })
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: '邮政编码', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;
}

export class UpdateAddressDto extends CreateAddressDto {
  @ApiProperty({ description: '地址ID' })
  @IsInt()
  id: number;
}