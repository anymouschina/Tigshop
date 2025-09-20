// @ts-nocheck
import { IsString, IsEmail, IsNotEmpty, IsEnum, IsOptional, MinLength, MaxLength, IsMobilePhone } from 'class-validator';

export enum LoginType {
  PASSWORD = 'password',
  MOBILE = 'mobile',
  EMAIL = 'email',
}

export class LoginDto {
  @IsEnum(LoginType, { message: '登录类型不正确' })
  @IsNotEmpty({ message: '登录类型不能为空' })
  login_type: LoginType;

  @IsOptional()
  @IsString({ message: '用户名格式不正确' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username?: string;

  @IsOptional()
  @IsString({ message: '密码格式不正确' })
  @IsNotEmpty({ message: '密码不能为空' })
  password?: string;

  @IsOptional()
  @IsMobilePhone('zh-CN', { message: '手机号格式不正确' })
  @IsNotEmpty({ message: '手机号不能为空' })
  mobile?: string;

  @IsOptional()
  @IsString({ message: '验证码格式不正确' })
  @IsNotEmpty({ message: '验证码不能为空' })
  mobile_code?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email?: string;

  @IsOptional()
  @IsString({ message: '邮箱验证码格式不正确' })
  @IsNotEmpty({ message: '邮箱验证码不能为空' })
  email_code?: string;

  @IsOptional()
  @IsString({ message: '验证token格式不正确' })
  verify_token?: string;
}

export class RegisterDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString({ message: '密码格式不正确' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  password: string;

  @IsString({ message: '确认密码格式不正确' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  confirm_password: string;

  @IsOptional()
  @IsString({ message: '用户名格式不正确' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username?: string;

  @IsOptional()
  @IsString({ message: '邮箱验证码格式不正确' })
  @IsNotEmpty({ message: '邮箱验证码不能为空' })
  email_code?: string;

  @IsOptional()
  @IsNumber({}, { message: '推荐人ID格式不正确' })
  referrer_user_id?: number;

  @IsOptional()
  @IsString({ message: '验证token格式不正确' })
  verify_token?: string;
}

export class ForgetPasswordDto {
  @IsMobilePhone('zh-CN', { message: '手机号格式不正确' })
  @IsNotEmpty({ message: '手机号不能为空' })
  mobile: string;

  @IsString({ message: '验证码格式不正确' })
  @IsNotEmpty({ message: '验证码不能为空' })
  code: string;

  @IsString({ message: '新密码格式不正确' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  password: string;

  @IsString({ message: '确认密码格式不正确' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  confirm_password: string;
}

export class SendMobileCodeDto {
  @IsMobilePhone('zh-CN', { message: '手机号格式不正确' })
  @IsNotEmpty({ message: '手机号不能为空' })
  mobile: string;

  @IsString({ message: '事件类型格式不正确' })
  @IsNotEmpty({ message: '事件类型不能为空' })
  event: string;

  @IsOptional()
  @IsString({ message: '验证token格式不正确' })
  verify_token?: string;
}

export class SendEmailCodeDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString({ message: '事件类型格式不正确' })
  @IsNotEmpty({ message: '事件类型不能为空' })
  event: string;

  @IsOptional()
  @IsString({ message: '验证token格式不正确' })
  verify_token?: string;
}

export class CheckMobileCodeDto {
  @IsMobilePhone('zh-CN', { message: '手机号格式不正确' })
  @IsNotEmpty({ message: '手机号不能为空' })
  mobile: string;

  @IsString({ message: '验证码格式不正确' })
  @IsNotEmpty({ message: '验证码不能为空' })
  code: string;

  @IsString({ message: '事件类型格式不正确' })
  @IsNotEmpty({ message: '事件类型不能为空' })
  event: string = 'forget_password';
}

export class CheckEmailCodeDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString({ message: '验证码格式不正确' })
  @IsNotEmpty({ message: '验证码不能为空' })
  code: string;

  @IsString({ message: '事件类型格式不正确' })
  @IsNotEmpty({ message: '事件类型不能为空' })
  event: string = 'register_code';
}

export class WechatLoginUrlDto {
  @IsString({ message: '回调URL格式不正确' })
  @IsNotEmpty({ message: '回调URL不能为空' })
  url: string;
}

export class WechatLoginByCodeDto {
  @IsString({ message: 'code格式不正确' })
  @IsNotEmpty({ message: 'code不能为空' })
  code: string;
}

export class BindWechatDto {
  @IsString({ message: 'code格式不正确' })
  @IsNotEmpty({ message: 'code不能为空' })
  code: string;
}

export class BindMobileDto {
  @IsMobilePhone('zh-CN', { message: '手机号格式不正确' })
  @IsNotEmpty({ message: '手机号不能为空' })
  mobile: string;

  @IsString({ message: '验证码格式不正确' })
  @IsNotEmpty({ message: '验证码不能为空' })
  mobile_code: string;

  @IsOptional()
  @IsString({ message: '密码格式不正确' })
  password?: string;

  @IsOptional()
  open_data?: any;

  @IsOptional()
  @IsNumber({}, { message: '推荐人ID格式不正确' })
  referrer_user_id?: number;
}

export class WechatEventDto {
  @IsString({ message: 'key格式不正确' })
  @IsNotEmpty({ message: 'key不能为空' })
  key: string;
}

export class GetUserMobileDto {
  @IsString({ message: 'code格式不正确' })
  @IsNotEmpty({ message: 'code不能为空' })
  code: string;
}

export class UpdateUserOpenIdDto {
  @IsString({ message: 'code格式不正确' })
  @IsNotEmpty({ message: 'code不能为空' })
  code: string;
}

export class JsSdkConfigDto {
  @IsString({ message: 'URL格式不正确' })
  @IsNotEmpty({ message: 'URL不能为空' })
  url: string;
}

export class QuickLoginSettingResponse {
  wechat_login: number;
  show_oauth: number;
}
