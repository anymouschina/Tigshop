// @ts-nocheck
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateShopTableDto {
  @IsInt()
  @Min(1)
  shopId: number;

  @IsString()
  tableNo: string;

  @IsOptional()
  @IsString()
  qrCodeKey?: string;

  @IsOptional()
  @IsInt()
  capacity?: number;

  @IsOptional()
  @IsString()
  area?: string;
}

export class UpdateShopTableDto extends CreateShopTableDto {}
