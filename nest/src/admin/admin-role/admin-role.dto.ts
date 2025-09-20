import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsInt, MaxLength, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AdminRoleQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 15;

  @IsOptional()
  @IsString()
  sort_field?: string = 'id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class AdminRoleDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateAdminRoleDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string = '';

  @IsOptional()
  @IsString()
  permissions?: string = '';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number = 1;
}

export class UpdateAdminRoleDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  permissions?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;
}

export class DeleteAdminRoleDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteAdminRoleDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const ROLE_STATUS = {
  0: '禁用',
  1: '启用',
};