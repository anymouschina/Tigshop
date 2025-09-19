import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum AppVersionStatus {
  DRAFT = 0, // 草稿
  PUBLISHED = 1, // 已发布
}

export class AppVersionQueryDto {
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

  @ApiProperty({ description: '状态', required: false, enum: AppVersionStatus })
  @IsOptional()
  @IsEnum(AppVersionStatus)
  status?: AppVersionStatus;

  @ApiProperty({ description: '排序字段', required: false, default: 'version_id' })
  @IsOptional()
  @IsString()
  sortField?: string = 'version_id';

  @ApiProperty({ description: '排序方向', required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateAppVersionDto {
    @ApiProperty({ description: '版本号' })
  @IsNotEmpty()
  @IsString()
  Version: string;

  @ApiProperty({ description: '构建号' })
  @IsNotEmpty()
  @IsString()
  BuildNumber: string;

  @ApiProperty({ description: '下载地址' })
  @IsNotEmpty()
  @IsString()
  DownloadUrl: string;

  @ApiProperty({ description: '更新日志' })
  @IsNotEmpty()
  @IsString()
  UpdateLog: string;

  @ApiProperty({ description: '强制更新' })
  @IsNotEmpty()
  @IsString()
  ForceUpdate: string;
}

export class UpdateAppVersionDto {
    @ApiProperty({ description: '版本号', required: false })
  @IsOptional()
  @IsString()
  Version?: string;

  @ApiProperty({ description: '构建号', required: false })
  @IsOptional()
  @IsString()
  BuildNumber?: string;

  @ApiProperty({ description: '下载地址', required: false })
  @IsOptional()
  @IsString()
  DownloadUrl?: string;

  @ApiProperty({ description: '更新日志', required: false })
  @IsOptional()
  @IsString()
  UpdateLog?: string;

  @ApiProperty({ description: 'status', required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;

  @ApiProperty({ description: '强制更新', required: false })
  @IsOptional()
  @IsString()
  ForceUpdate?: string;
}

export class AppVersionConfigDto {
  @ApiProperty({ description: '状态配置' })
  statusConfig: Record<string, string>;
}
