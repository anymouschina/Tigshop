// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export enum UploadType {
  PRODUCT = "product",
  USER = "user",
  CATEGORY = "category",
  BRAND = "brand",
  ORDER = "order",
  OTHER = "other",
}

export class UploadDto {
  @ApiProperty({ description: "文件类型", enum: UploadType })
  @IsEnum(UploadType)
  type: UploadType;

  @ApiProperty({ description: "关联ID（可选）" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  relatedId?: number;

  @ApiProperty({ description: "文件描述" })
  @IsOptional()
  @IsString()
  description?: string;
}
