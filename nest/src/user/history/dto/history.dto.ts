// @ts-nocheck
import { IsNotEmpty, IsInt, IsOptional, IsString, IsArray, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class HistoryListDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsInt({ message: '页码必须为整数' })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 20 })
  @IsOptional()
  @IsInt({ message: '每页数量必须为整数' })
  @Type(() => Number)
  size?: number = 20;

  @ApiProperty({ description: '排序字段', required: false, default: 'view_time' })
  @IsOptional()
  @IsString({ message: '排序字段格式不正确' })
  sort_field?: string = 'view_time';

  @ApiProperty({ description: '排序方式', required: false, default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方式不正确' })
  sort_order?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: '关键词搜索', required: false })
  @IsOptional()
  @IsString({ message: '关键词格式不正确' })
  keyword?: string;
}

export class AddHistoryDto {
  @ApiProperty({ description: '商品ID' })
  @IsNotEmpty({ message: '商品ID不能为空' })
  @IsInt({ message: '商品ID必须为整数' })
  @Type(() => Number)
  product_id: number;

  @ApiProperty({ description: '浏览时长（秒）', required: false })
  @IsOptional()
  @IsInt({ message: '浏览时长必须为整数' })
  @Min(0, { message: '浏览时长不能为负数' })
  @Type(() => Number)
  view_duration?: number = 0;

  @ApiProperty({ description: '来源页面', required: false })
  @IsOptional()
  @IsString({ message: '来源页面格式不正确' })
  source_page?: string;
}

export class DeleteHistoryDto {
  @ApiProperty({ description: '浏览历史ID数组' })
  @IsNotEmpty({ message: '浏览历史ID数组不能为空' })
  @IsArray({ message: '浏览历史ID必须为数组' })
  @IsInt({ each: true, message: '浏览历史ID必须为整数' })
  ids: number[];
}

export class ClearHistoryDto {
  @ApiProperty({ description: '清除类型', required: false, enum: ['all', 'older_than'] })
  @IsOptional()
  @IsEnum(['all', 'older_than'], { message: '清除类型不正确' })
  clear_type?: 'all' | 'older_than' = 'all';

  @ApiProperty({ description: '清除多少天前的记录', required: false })
  @IsOptional()
  @IsInt({ message: '天数必须为整数' })
  @Min(1, { message: '天数必须大于0' })
  @Max(365, { message: '天数不能超过365' })
  @Type(() => Number)
  days?: number = 30;
}

export class HistoryDetailDto {
  @ApiProperty({ description: '浏览历史ID' })
  @IsNotEmpty({ message: '浏览历史ID不能为空' })
  @IsInt({ message: '浏览历史ID必须为整数' })
  @Type(() => Number)
  id: number;
}

export class HistoryStatsDto {
  @ApiProperty({ description: '统计天数', required: false, default: 30 })
  @IsOptional()
  @IsInt({ message: '统计天数必须为整数' })
  @Min(1, { message: '统计天数必须大于0' })
  @Max(365, { message: '统计天数不能超过365' })
  @Type(() => Number)
  days?: number = 30;
}

export class HistoryListResponse {
  @ApiProperty({ description: '浏览历史列表' })
  records: any[];

  @ApiProperty({ description: '总数量' })
  total: number;

  @ApiProperty({ description: '页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  size: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

export class HistoryResponse {
  @ApiProperty({ description: '浏览历史详情' })
  history: any;

  @ApiProperty({ description: '消息' })
  message?: string;
}

export class HistoryStatsResponse {
  @ApiProperty({ description: '总浏览次数' })
  total_views: number;

  @ApiProperty({ description: '浏览商品数量' })
  product_count: number;

  @ApiProperty({ description: '平均浏览时长（秒）' })
  avg_duration: number;

  @ApiProperty({ description: '最近浏览时间' })
  last_view_time: string;

  @ApiProperty({ description: '每日浏览统计' })
  daily_stats: any[];
}

export class SuccessResponse {
  @ApiProperty({ description: '消息' })
  message?: string;

  @ApiProperty({ description: '浏览历史ID', required: false })
  history_id?: number;
}
