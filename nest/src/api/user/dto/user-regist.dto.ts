import { IsString, IsEmail, IsMobilePhone, IsEnum, IsOptional, IsNumber, MinLength, Matches } from 'class-validator';

export enum RegistType {
  MOBILE = 'mobile',
  EMAIL = 'email',
}

export class RegistDto {
  @IsEnum(RegistType, { message: '注册类型不正确' })
  regist_type: RegistType = RegistType.MOBILE;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @MinLength(6, { message: '密码长度至少6位' })
  password: string;

  @IsOptional()
  @IsMobilePhone('zh-CN', { message: '手机号格式不正确' })
  mobile?: string;

  @IsOptional()
  @IsString()
  mobile_code?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @IsString()
  email_code?: string;

  @IsOptional()
  @IsNumber()
  salesman_id?: number = 0;

  @IsOptional()
  @IsNumber()
  referrer_user_id?: number = 0;
}

export class SendEmailCodeDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsOptional()
  @IsString()
  verify_token?: string;
}