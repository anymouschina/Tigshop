// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

export enum NotificationType {
  SYSTEM = "system",
  ORDER = "order",
  PRODUCT = "product",
  USER = "user",
  PAYMENT = "payment",
  SHIPPING = "shipping",
  PROMOTION = "promotion",
  AFTERSALE = "aftersale",
}

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  WECHAT = "wechat",
}

export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

export class CreateNotificationDto {
  @ApiProperty({ description: "通知类型", enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: "通知标题" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "通知内容" })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: "通知渠道",
    enum: NotificationChannel,
    isArray: true,
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiProperty({ description: "通知优先级", enum: NotificationPriority })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({ description: "接收用户ID（可选）" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: "接收用户ID列表（可选）" })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  userIds?: number[];

  @ApiProperty({ description: "关联数据（可选）" })
  @IsOptional()
  relatedData?: any;

  @ApiProperty({ description: "计划发送时间（可选）" })
  @IsOptional()
  scheduledAt?: Date;

  @ApiProperty({ description: "过期时间（可选）" })
  @IsOptional()
  expireAt?: Date;
}

export class UpdateNotificationDto {
  @ApiProperty({ description: "通知标题" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: "通知内容" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: "通知状态", enum: NotificationStatus })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({ description: "已读状态" })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({ description: "关联数据" })
  @IsOptional()
  relatedData?: any;

  @ApiProperty({ description: "过期时间" })
  @IsOptional()
  expireAt?: Date;
}

export class NotificationQueryDto {
  @ApiProperty({ description: "搜索关键词" })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: "通知类型" })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ description: "通知渠道" })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiProperty({ description: "通知状态" })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({ description: "用户ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: "是否已读" })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({ description: "优先级" })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiProperty({ description: "开始时间" })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ description: "结束时间" })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ description: "页码" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: "每页数量" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  size?: number;

  @ApiProperty({ description: "排序字段" })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiProperty({ description: "排序方式" })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}

export class MarkAsReadDto {
  @ApiProperty({ description: "通知ID列表" })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  notificationIds: number[];
}

export class NotificationTemplateDto {
  @ApiProperty({ description: "模板名称" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "模板代码" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: "通知类型", enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: "通知渠道",
    enum: NotificationChannel,
    isArray: true,
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiProperty({ description: "标题模板" })
  @IsString()
  @IsNotEmpty()
  titleTemplate: string;

  @ApiProperty({ description: "内容模板" })
  @IsString()
  @IsNotEmpty()
  contentTemplate: string;

  @ApiProperty({ description: "模板描述" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "是否启用" })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
