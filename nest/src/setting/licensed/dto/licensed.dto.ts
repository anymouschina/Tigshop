import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum LicensedStatus {
  INVALID = 0, // 无效
  VALID = 1, // 有效
  EXPIRED = 2, // 已过期
}

export class LicensedQueryDto {
  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  size?: number = 15;

  @ApiProperty({ description: '状态', required: false, enum: LicensedStatus })
  @IsOptional()
  @IsEnum(LicensedStatus)
  status?: LicensedStatus;

  @ApiProperty({ description: '排序字段', required: false, default: 'licensed_id' })
  @IsOptional()
  @IsString()
  sortField?: string = 'licensed_id';

  @ApiProperty({ description: '排序方向', required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateLicensedDto {
    @ApiProperty({ description: '域名' })
  @IsNotEmpty()
  @IsString()
  Domain: string;

  @ApiProperty({ description: '授权码' })
  @IsNotEmpty()
  @IsString()
  LicenseKey: string;

  @ApiProperty({ description: '过期时间' })
  @IsNotEmpty()
  @IsString()
  ExpireTime: string;
}

export class UpdateLicensedDto {
    @ApiProperty({ description: '域名', required: false })
  @IsOptional()
  @IsString()
  Domain?: string;

  @ApiProperty({ description: '授权码', required: false })
  @IsOptional()
  @IsString()
  LicenseKey?: string;

  @ApiProperty({ description: '过期时间', required: false })
  @IsOptional()
  @IsString()
  ExpireTime?: string;

  @ApiProperty({ description: 'status', required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;
}

export class LicensedConfigDto {
  @ApiProperty({ description: '状态配置' })
  statusConfig: Record<string, string>;
}
