// @ts-nocheck
import { IsString, IsNumber, IsOptional, IsEnum } from "class-validator";

export class CreateRegionDto {
  @IsString()
  name: string;

  @IsNumber()
  parent_id: number;

  @IsString()
  level: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  zip_code?: string;

  @IsOptional()
  @IsString()
  first_letter?: string;

  @IsOptional()
  @IsString()
  pinyin?: string;

  @IsOptional()
  @IsString()
  lng?: string;

  @IsOptional()
  @IsString()
  lat?: string;

  @IsOptional()
  @IsNumber()
  sort?: number = 0;

  @IsOptional()
  @IsEnum([0, 1])
  is_using?: number = 1;
}

export class UpdateRegionDto extends CreateRegionDto {
  @IsNumber()
  id: number;
}
