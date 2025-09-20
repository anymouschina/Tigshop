// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsEnum,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum MessageSendType {
  MEMBER = 1, // 会员
  MERCHANT = 2, // 商家
}

export class MessageTypeQueryDto {
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
  sort_field?: string = "message_id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";

  @IsOptional()
  @IsEnum(MessageSendType)
  send_type?: MessageSendType;

  @IsOptional()
  @IsString()
  message_id?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  paging?: boolean = true;
}

export class MessageTypeDetailDto {
  @IsNumber()
  @Type(() => Number)
  message_id: number;
}

export class CreateMessageTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  describe?: string = "";

  @IsEnum(MessageSendType)
  @Type(() => Number)
  send_type: MessageSendType = MessageSendType.MEMBER;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_wechat?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_mini_program?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_message?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_msg?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_app?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_ding?: boolean = false;
}

export class UpdateMessageTypeDto {
  @IsNumber()
  @Type(() => Number)
  message_id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  describe?: string;

  @IsOptional()
  @IsEnum(MessageSendType)
  @Type(() => Number)
  send_type?: MessageSendType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_wechat?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_mini_program?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_message?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_msg?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_app?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_ding?: boolean;
}

export class UpdateMessageTypeFieldDto {
  @IsNumber()
  @Type(() => Number)
  message_id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteMessageTypeDto {
  @IsNumber()
  @Type(() => Number)
  message_id: number;
}

export class BatchDeleteMessageTypeDto {
  @IsArray()
  @IsNumber({}, { each: true })
  message_ids: number[];
}
