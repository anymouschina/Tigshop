import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  SYSTEM = 'system',
  WECHAT = 'wechat',
  PUSH = 'push',
}

export enum NotificationTemplate {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  CUSTOM = 'custom',
}

export class SendNotificationDto {
  @ApiProperty({ description: '用户ID' })
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: '通知类型', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: '通知模板', enum: NotificationTemplate })
  @IsEnum(NotificationTemplate)
  template: NotificationTemplate;

  @ApiProperty({ description: '通知标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '通知内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '模板数据（可选）' })
  @IsOptional()
  templateData?: Record<string, any>;

  @ApiProperty({ description: '是否立即发送', default: true })
  @IsOptional()
  @IsBoolean()
  sendImmediately?: boolean = true;

  @ApiProperty({ description: '定时发送时间（可选）' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiProperty({ description: '关联数据（可选）' })
  @IsOptional()
  relatedData?: Record<string, any>;

  @ApiProperty({ description: '优先级', default: 'normal' })
  @IsOptional()
  @IsString()
  priority?: 'low' | 'normal' | 'high' = 'normal';
}

export class BatchSendNotificationDto {
  @ApiProperty({ description: '用户ID列表' })
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];

  @ApiProperty({ description: '通知类型', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: '通知模板', enum: NotificationTemplate })
  @IsEnum(NotificationTemplate)
  template: NotificationTemplate;

  @ApiProperty({ description: '通知标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '通知内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '是否使用个性化模板数据' })
  @IsOptional()
  @IsBoolean()
  usePersonalizedData?: boolean = false;

  @ApiProperty({ description: '优先级', default: 'normal' })
  @IsOptional()
  @IsString()
  priority?: 'low' | 'normal' | 'high' = 'normal';
}