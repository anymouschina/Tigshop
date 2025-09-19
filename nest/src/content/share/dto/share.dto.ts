import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ShareStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

export class ShareQueryDto {
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

  @ApiProperty({ description: '状态', required: false, enum: ShareStatus })
  @IsOptional()
  @IsEnum(ShareStatus)
  status?: ShareStatus;

  @ApiProperty({ description: '排序字段', required: false, default: 'share_id' })
  @IsOptional()
  @IsString()
  sortField?: string = 'share_id';

  @ApiProperty({ description: '排序方向', required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateShareDto {
    @ApiProperty({ description: '标题' })
  @IsNotEmpty()
  @IsString()
  Title: string;

  @ApiProperty({ description: '描述' })
  @IsNotEmpty()
  @IsString()
  Description: string;

  @ApiProperty({ description: '图片' })
  @IsNotEmpty()
  @IsString()
  Image: string;
}

export class UpdateShareDto {
    @ApiProperty({ description: '标题', required: false })
  @IsOptional()
  @IsString()
  Title?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  Description?: string;

  @ApiProperty({ description: '图片', required: false })
  @IsOptional()
  @IsString()
  Image?: string;

  @ApiProperty({ description: 'status', required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;
}

export class ShareConfigDto {
  @ApiProperty({ description: '状态配置' })
  statusConfig: Record<string, string>;
}
