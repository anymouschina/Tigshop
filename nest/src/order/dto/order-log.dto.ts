// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
} from "class-validator";

export enum OrderLogActionType {
  CREATE = "create",
  UPDATE = "update",
  CANCEL = "cancel",
  SHIP = "ship",
  RECEIVE = "receive",
  REFUND = "refund",
  RETURN = "return",
  REVIEW = "review",
  OTHER = "other",
}

export class OrderLogQueryDto {
  @ApiProperty({ description: "订单ID", required: false })
  @IsOptional()
  @IsNumber()
  order_id?: number;

  @ApiProperty({ description: "用户ID", required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ description: "操作类型", required: false })
  @IsOptional()
  @IsEnum(OrderLogActionType)
  action_type?: OrderLogActionType;

  @ApiProperty({ description: "页码", required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false })
  @IsOptional()
  @IsNumber()
  size?: number = 15;

  @ApiProperty({ description: "开始时间", required: false })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiProperty({ description: "结束时间", required: false })
  @IsOptional()
  @IsString()
  end_time?: string;
}

export class OrderLogDetailDto {
  @ApiProperty({ description: "日志ID" })
  @IsNumber()
  id: number;
}
