// @ts-nocheck
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum TimeDiscountStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

export class TimeDiscountQueryDto {
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

  @ApiProperty({ description: '状态', required: false, enum: TimeDiscountStatus })
  @IsOptional()
  @IsEnum(TimeDiscountStatus)
  status?: TimeDiscountStatus;

  @ApiProperty({ description: '排序字段', required: false, default: 'discount_id' })
  @IsOptional()
  @IsString()
  sortField?: string = 'discount_id';

  @ApiProperty({ description: '排序方向', required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateTimeDiscountDto {
    @ApiProperty({ description: '名称' })
  @IsNotEmpty()
  @IsString()
  Name: string;

  @ApiProperty({ description: '开始时间' })
  @IsNotEmpty()
  @IsString()
  StartTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsNotEmpty()
  @IsString()
  EndTime: string;

  @ApiProperty({ description: '折扣' })
  @IsNotEmpty()
  @Type(() => Number)
  Discount: number;
}

export class UpdateTimeDiscountDto {
    @ApiProperty({ description: '名称', required: false })
  @IsOptional()
  @IsString()
  Name?: string;

  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  @IsString()
  StartTime?: string;

  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  @IsString()
  EndTime?: string;

  @ApiProperty({ description: '折扣', required: false })
  @IsOptional()
  @Type(() => Number)
  Discount?: number;

  @ApiProperty({ description: 'status', required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;
}

export class TimeDiscountConfigDto {
  @ApiProperty({ description: '状态配置' })
  statusConfig: Record<string, string>;
}
