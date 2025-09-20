// @ts-nocheck
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from "class-validator";

export class MessageQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 10;

  @IsOptional()
  @IsEnum(["all", "unread", "read"])
  status?: string = "all";

  @IsOptional()
  @IsEnum(["system", "order", "promotion", "service"])
  message_type?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
}

export class MessageBatchDto {
  @IsArray()
  @ArrayNotEmpty()
  message_ids: number[];
}
