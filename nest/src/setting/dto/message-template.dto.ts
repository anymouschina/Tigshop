import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum MessageTemplateType {
  WECHAT = 1,        // 微信公众号
  MINI_PROGRAM = 2,  // 小程序
  SMS = 3,           // 短信
  SITE_MESSAGE = 4,  // 站内消息
  APP = 5,           // APP
  DINGTALK = 6,      // 钉钉
}

export class MessageTemplateQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 15;

  @IsOptional()
  @IsString()
  sort_field?: string = 'id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsEnum(MessageTemplateType)
  type?: MessageTemplateType;

  @IsOptional()
  @IsString()
  message_id?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  paging?: boolean = true;
}

export class MessageTemplateDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateMessageTemplateDto {
  @IsString()
  message_id: string;

  @IsEnum(MessageTemplateType)
  @Type(() => Number)
  type: MessageTemplateType;

  @IsString()
  template_name: string;

  @IsOptional()
  @IsString()
  to_userid?: string = '';

  @IsString()
  template_id: string;

  @IsOptional()
  @IsString()
  template_num?: string = '';

  @IsString()
  content: string;
}

export class UpdateMessageTemplateDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  message_id?: string;

  @IsOptional()
  @IsEnum(MessageTemplateType)
  @Type(() => Number)
  type?: MessageTemplateType;

  @IsOptional()
  @IsString()
  template_name?: string;

  @IsOptional()
  @IsString()
  to_userid?: string;

  @IsOptional()
  @IsString()
  template_id?: string;

  @IsOptional()
  @IsString()
  template_num?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateMessageTemplateFieldDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteMessageTemplateDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteMessageTemplateDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}