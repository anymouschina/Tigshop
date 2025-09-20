// @ts-nocheck
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max, IsBoolean } from 'class-validator';

export class CreateProductAttributesTplDto {
  @ApiProperty({ description: '名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '排序值', default: 50 })
  @IsNumber()
  @Min(0)
  @Max(999)
  sort_order: number = 50;

  @ApiProperty({ description: '状态', default: true })
  @IsBoolean()
  status: boolean = true;
}

export class UpdateProductAttributesTplDto {
  @ApiProperty({ description: '名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '排序值', required: false })
  @IsNumber()
  @Min(0)
  @Max(999)
  @IsOptional()
  sort_order?: number;

  @ApiProperty({ description: '状态', required: false })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class QueryProductAttributesTplDto {
  @ApiProperty({ description: '关键词', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ description: '页码', default: 1 })
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: '每页数量', default: 15 })
  @IsNumber()
  @Min(1)
  @Max(100)
  size: number = 15;

  @ApiProperty({ description: '排序字段', default: 'id' })
  @IsString()
  @IsOptional()
  sort_field?: string = 'id';

  @ApiProperty({ description: '排序方式', default: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc' = 'desc';
}
