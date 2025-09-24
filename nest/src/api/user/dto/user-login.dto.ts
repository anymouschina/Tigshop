// @ts-nocheck
import {
  IsString,
  IsEmail,
  IsMobilePhone,
  IsEnum,
  IsOptional,
  IsNumber,
  MinLength,
  Matches,
} from "class-validator";

export enum LoginType {
  USERNAME = "username",
  MOBILE = "mobile",
  EMAIL = "email",
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6, { message: "密码长度至少6位" })
  password: string;

  @IsOptional()
  @IsEnum(LoginType)
  login_type?: LoginType = LoginType.USERNAME;

  @IsOptional()
  @IsString()
  code?: string;
}

export class SendMobileCodeDto {
  @IsMobilePhone("zh-CN", { message: "手机号格式不正确" })
  mobile: string;

  @IsString()
  @IsOptional()
  event?: string = "login"; // 默认为 login，与PHP实现一致

  @IsString()
  verify_token: string; // 行为验证令牌，与PHP实现一致
}

export class CheckMobileDto {
  @IsMobilePhone("zh-CN", { message: "手机号格式不正确" })
  mobile: string;
}

export class CheckEmailDto {
  @IsEmail({}, { message: "邮箱格式不正确" })
  email: string;
}

export class ForgetPasswordDto {
  @IsMobilePhone("zh-CN", { message: "手机号格式不正确" })
  mobile: string;

  @IsString()
  code: string;

  @IsString()
  @MinLength(6, { message: "新密码长度至少6位" })
  new_password: string;

  @IsString()
  confirm_password: string;
}

export class BindMobileDto {
  @IsString()
  wechat_info: string; // JSON字符串

  @IsMobilePhone("zh-CN", { message: "手机号格式不正确" })
  mobile: string;

  @IsString()
  code: string;
}

export class BindWechatDto {
  @IsString()
  code: string;
}

export class GetWxLoginUrlDto {
  @IsOptional()
  @IsString()
  redirect_url?: string;
}

export class WxLoginInfoDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class SendEmailCodeDto {
  @IsEmail({}, { message: "邮箱格式不正确" })
  email: string;

  @IsString()
  @IsOptional()
  event?: string = "register_code"; // 默认为 register_code，与PHP实现一致

  @IsString()
  verify_token: string; // 行为验证令牌，与PHP实现一致
}

export class ChangePasswordDto {
  @IsString()
  old_password: string;

  @IsString()
  @MinLength(6, { message: "新密码长度至少6位" })
  new_password: string;

  @IsString()
  confirm_password: string;
}

export class ModifyMobileDto {
  @IsMobilePhone("zh-CN", { message: "新手机号格式不正确" })
  new_mobile: string;

  @IsString()
  code: string;
}

export class ModifyEmailDto {
  @IsEmail({}, { message: "新邮箱格式不正确" })
  new_email: string;

  @IsString()
  code: string;
}
