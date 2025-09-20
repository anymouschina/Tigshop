import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsArray, IsEmail, IsBoolean, MinLength, MaxLength } from 'class-validator';

export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  FROZEN = -1,
}

export class AdminUserQueryDto {
  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsNumber()
  size?: number = 15;

  @ApiProperty({ description: '用户等级', required: false })
  @IsOptional()
  @IsNumber()
  user_rank?: number;

  @ApiProperty({ description: '用户状态', required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ description: '注册开始时间', required: false })
  @IsOptional()
  @IsString()
  register_start?: string;

  @ApiProperty({ description: '注册结束时间', required: false })
  @IsOptional()
  @IsString()
  register_end?: string;

  @ApiProperty({ description: '最后登录开始时间', required: false })
  @IsOptional()
  @IsString()
  last_login_start?: string;

  @ApiProperty({ description: '最后登录结束时间', required: false })
  @IsOptional()
  @IsString()
  last_login_end?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ description: '用户状态' })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({ description: '状态说明', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateUserInfoDto {
  @ApiProperty({ description: '用户名', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiProperty({ description: '昵称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: '头像', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '性别', required: false })
  @IsOptional()
  @IsEnum([0, 1, 2])
  gender?: number;

  @ApiProperty({ description: '生日', required: false })
  @IsOptional()
  @IsString()
  birthday?: string;

  @ApiProperty({ description: '用户等级', required: false })
  @IsOptional()
  @IsNumber()
  user_rank?: number;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  new_password: string;

  @ApiProperty({ description: '确认密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  confirm_password: string;

  @ApiProperty({ description: '是否发送通知', required: false })
  @IsOptional()
  @IsBoolean()
  send_notification?: boolean = true;
}

export class BatchUserOperationDto {
  @ApiProperty({ description: '用户ID列表' })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({ description: '操作类型' })
  @IsEnum(['activate', 'freeze', 'delete', 'reset_password', 'change_rank'])
  type: string;

  @ApiProperty({ description: '操作参数', required: false })
  @IsOptional()
  params?: any;
}