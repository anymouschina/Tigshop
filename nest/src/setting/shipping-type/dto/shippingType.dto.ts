import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ShippingTypeStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

export class ShippingTypeQueryDto {
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

  @ApiProperty({ description: '状态', required: false, enum: ShippingTypeStatus })
  @IsOptional()
  @IsEnum(ShippingTypeStatus)
  status?: ShippingTypeStatus;

  @ApiProperty({ description: '排序字段', required: false, default: 'type_id' })
  @IsOptional()
  @IsString()
  sortField?: string = 'type_id';

  @ApiProperty({ description: '排序方向', required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateShippingTypeDto {
    @ApiProperty({ description: '名称' })
  @IsNotEmpty()
  @IsString()
  Name: string;

  @ApiProperty({ description: '编码' })
  @IsNotEmpty()
  @IsString()
  Code: string;

  @ApiProperty({ description: '图标' })
  @IsNotEmpty()
  @IsString()
  Icon: string;

  @ApiProperty({ description: '排序' })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0)
  @Max(999)
  Sort: number;
}

export class UpdateShippingTypeDto {
    @ApiProperty({ description: '名称', required: false })
  @IsOptional()
  @IsString()
  Name?: string;

  @ApiProperty({ description: '编码', required: false })
  @IsOptional()
  @IsString()
  Code?: string;

  @ApiProperty({ description: '图标', required: false })
  @IsOptional()
  @IsString()
  Icon?: string;

  @ApiProperty({ description: 'status', required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(999)
  Sort?: number;
}

export class ShippingTypeConfigDto {
  @ApiProperty({ description: '状态配置' })
  statusConfig: Record<string, string>;
}
