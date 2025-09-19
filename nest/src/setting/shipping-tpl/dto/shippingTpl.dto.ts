import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ShippingTplStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

export class ShippingTplQueryDto {
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

  @ApiProperty({ description: '状态', required: false, enum: ShippingTplStatus })
  @IsOptional()
  @IsEnum(ShippingTplStatus)
  status?: ShippingTplStatus;

  @ApiProperty({ description: '排序字段', required: false, default: 'tpl_id' })
  @IsOptional()
  @IsString()
  sortField?: string = 'tpl_id';

  @ApiProperty({ description: '排序方向', required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateShippingTplDto {
    @ApiProperty({ description: '名称' })
  @IsNotEmpty()
  @IsString()
  Name: string;

  @ApiProperty({ description: 'is_default' })
  @IsNotEmpty()
  @IsString()
  IsDefault: string;

  @ApiProperty({ description: '免费金额' })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(0)
  FreeAmount: number;
}

export class UpdateShippingTplDto {
    @ApiProperty({ description: '名称', required: false })
  @IsOptional()
  @IsString()
  Name?: string;

  @ApiProperty({ description: 'is_default', required: false })
  @IsOptional()
  @IsString()
  IsDefault?: string;

  @ApiProperty({ description: '免费金额', required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  FreeAmount?: number;

  @ApiProperty({ description: 'status', required: false })
  @IsOptional()
  @Type(() => Number)
  Status?: number;
}

export class ShippingTplConfigDto {
  @ApiProperty({ description: '状态配置' })
  statusConfig: Record<string, string>;
}
