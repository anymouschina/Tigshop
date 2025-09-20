import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max, IsBoolean } from 'class-validator';

export class CreateECardDto {
  @ApiProperty({ description: '卡券名称' })
  @IsString()
  card_name: string;

  @ApiProperty({ description: '卡券编号' })
  @IsString()
  card_sn: string;

  @ApiProperty({ description: '卡券密码' })
  @IsString()
  card_password: string;

  @ApiProperty({ description: '分组ID' })
  @IsNumber()
  group_id: number;

  @ApiProperty({ description: '面值' })
  @IsNumber()
  @Min(0)
  face_value: number;

  @ApiProperty({ description: '使用状态', default: 0 })
  @IsBoolean()
  is_use: boolean = false;

  @ApiProperty({ description: '有效期开始时间' })
  @IsString()
  @IsOptional()
  start_time?: string;

  @ApiProperty({ description: '有效期结束时间' })
  @IsString()
  @IsOptional()
  end_time?: string;

  @ApiProperty({ description: '排序值', default: 50 })
  @IsNumber()
  @Min(0)
  @Max(999)
  sort_order: number = 50;
}

export class UpdateECardDto {
  @ApiProperty({ description: '卡券名称', required: false })
  @IsString()
  @IsOptional()
  card_name?: string;

  @ApiProperty({ description: '卡券编号', required: false })
  @IsString()
  @IsOptional()
  card_sn?: string;

  @ApiProperty({ description: '卡券密码', required: false })
  @IsString()
  @IsOptional()
  card_password?: string;

  @ApiProperty({ description: '分组ID', required: false })
  @IsNumber()
  @IsOptional()
  group_id?: number;

  @ApiProperty({ description: '面值', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  face_value?: number;

  @ApiProperty({ description: '使用状态', required: false })
  @IsBoolean()
  @IsOptional()
  is_use?: boolean;

  @ApiProperty({ description: '有效期开始时间', required: false })
  @IsString()
  @IsOptional()
  start_time?: string;

  @ApiProperty({ description: '有效期结束时间', required: false })
  @IsString()
  @IsOptional()
  end_time?: string;

  @ApiProperty({ description: '排序值', required: false })
  @IsNumber()
  @Min(0)
  @Max(999)
  @IsOptional()
  sort_order?: number;
}

export class QueryECardDto {
  @ApiProperty({ description: '分组ID', required: false })
  @IsNumber()
  @IsOptional()
  group_id?: number;

  @ApiProperty({ description: '使用状态', required: false })
  @IsNumber()
  @IsOptional()
  is_use?: number;

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