import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum } from 'class-validator';

export enum MessageLogType {
  SYSTEM = 1,
  ORDER = 2,
  PAYMENT = 3,
  PROMOTION = 4,
  SERVICE = 5,
}

export enum MessageLogStatus {
  UNREAD = 0,
  READ = 1,
}

export class CreateUserMessageLogDto {
  @ApiProperty({ description: '用户ID' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: '消息标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '消息内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '消息类型' })
  @IsEnum(MessageLogType)
  message_type: MessageLogType;

  @ApiProperty({ description: '状态', default: 0 })
  @IsOptional()
  @IsEnum(MessageLogStatus)
  status?: MessageLogStatus;
}

export class UpdateUserMessageLogDto {
  @ApiProperty({ description: '消息标题', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '消息内容', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '消息类型', required: false })
  @IsOptional()
  @IsEnum(MessageLogType)
  message_type?: MessageLogType;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsEnum(MessageLogStatus)
  status?: MessageLogStatus;
}

export class BatchDeleteDto {
  @ApiProperty({ description: 'ID数组' })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({ description: '操作类型' })
  @IsString()
  type: string;
}

export class QueryMessageLogDto {
  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '消息类型', required: false })
  @IsOptional()
  @IsEnum(MessageLogType)
  message_type?: MessageLogType;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsEnum(MessageLogStatus)
  status?: MessageLogStatus;

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiProperty({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: '每页数量', default: 15 })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiProperty({ description: '排序字段', default: 'log_id' })
  @IsOptional()
  @IsString()
  sort_field?: string;

  @ApiProperty({ description: '排序方式', default: 'desc' })
  @IsOptional()
  @IsString()
  sort_order?: string;
}