// @ts-nocheck
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';

export class CreateExampleDto {
  @ApiProperty({ description: '示例名称' })
  @IsString()
  example_name: string;

  @ApiProperty({ description: '排序值', default: 50 })
  @IsNumber()
  @Min(0)
  @Max(999)
  sort_order: number = 50;
}

export class UpdateExampleDto {
  @ApiProperty({ description: '示例名称', required: false })
  @IsString()
  @IsOptional()
  example_name?: string;

  @ApiProperty({ description: '排序值', required: false })
  @IsNumber()
  @Min(0)
  @Max(999)
  @IsOptional()
  sort_order?: number;
}

export class QueryExampleDto {
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
