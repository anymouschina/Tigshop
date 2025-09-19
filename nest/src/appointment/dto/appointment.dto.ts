import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export enum AppointmentType {
  CONSULTATION = 'consultation',
  SERVICE = 'service',
  DELIVERY = 'delivery',
  INSTALLATION = 'installation',
  MAINTENANCE = 'maintenance',
  INSPECTION = 'inspection',
  TRAINING = 'training',
  OTHER = 'other',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export class CreateAppointmentDto {
  @ApiProperty({ description: '预约类型', enum: AppointmentType })
  @IsEnum(AppointmentType)
  @IsNotEmpty()
  type: AppointmentType;

  @ApiProperty({ description: '预约标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '预约描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '客户ID' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  customerId: number;

  @ApiProperty({ description: '服务人员ID（可选）' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  staffId?: number;

  @ApiProperty({ description: '预约开始时间' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty({ description: '预约结束时间' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endTime: Date;

  @ApiProperty({ description: '预约地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: '联系手机' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: '预约费用' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fee?: number;

  @ApiProperty({ description: '是否需要支付' })
  @IsOptional()
  @IsBoolean()
  requirePayment?: boolean;

  @ApiProperty({ description: '最大预约人数' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxParticipants?: number;

  @ApiProperty({ description: '预约服务项目ID（可选）' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  serviceId?: number;

  @ApiProperty({ description: '关联订单ID（可选）' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orderId?: number;
}

export class UpdateAppointmentDto {
  @ApiProperty({ description: '预约类型' })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiProperty({ description: '预约标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '预约描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '服务人员ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  staffId?: number;

  @ApiProperty({ description: '预约开始时间' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @ApiProperty({ description: '预约结束时间' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endTime?: Date;

  @ApiProperty({ description: '预约地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: '联系手机' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: '预约状态' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ description: '支付状态' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ description: '预约费用' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fee?: number;

  @ApiProperty({ description: '最大预约人数' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxParticipants?: number;
}

export class AppointmentQueryDto {
  @ApiProperty({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '预约类型' })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiProperty({ description: '预约状态' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ description: '支付状态' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ description: '客户ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;

  @ApiProperty({ description: '服务人员ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  staffId?: number;

  @ApiProperty({ description: '服务项目ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  serviceId?: number;

  @ApiProperty({ description: '关联订单ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orderId?: number;

  @ApiProperty({ description: '开始时间' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @ApiProperty({ description: '结束时间' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endTime?: Date;

  @ApiProperty({ description: '页码' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: '每页数量' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  size?: number;

  @ApiProperty({ description: '排序字段' })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiProperty({ description: '排序方式' })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}

export class CancelAppointmentDto {
  @ApiProperty({ description: '取消原因' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: '取消备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ description: '新的开始时间' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  newStartTime: Date;

  @ApiProperty({ description: '新的结束时间' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  newEndTime: Date;

  @ApiProperty({ description: '重新安排原因' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: '重新安排备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AppointmentAvailabilityDto {
  @ApiProperty({ description: '服务人员ID' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  staffId: number;

  @ApiProperty({ description: '日期' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ description: '预约时长（分钟）' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  duration: number;
}

export class AppointmentServiceDto {
  @ApiProperty({ description: '服务名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '服务描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '服务时长（分钟）' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  duration: number;

  @ApiProperty({ description: '服务费用' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: '服务类型', enum: AppointmentType })
  @IsEnum(AppointmentType)
  @IsNotEmpty()
  type: AppointmentType;

  @ApiProperty({ description: '是否需要支付' })
  @IsOptional()
  @IsBoolean()
  requirePayment?: boolean;

  @ApiProperty({ description: '最大预约人数' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxParticipants?: number;

  @ApiProperty({ description: '服务状态' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}