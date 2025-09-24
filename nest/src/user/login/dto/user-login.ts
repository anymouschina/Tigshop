// @ts-nocheck
import {
  IsString,
  IsEmail,
  IsMobilePhone,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  validate,
  ValidationError,
} from "class-validator";

export enum LoginType {
  PASSWORD = "password",
  MOBILE = "mobile",
  EMAIL = "email",
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEnum(LoginType)
  loginType: LoginType = LoginType.PASSWORD;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  mobileCode?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  emailCode?: string;

  @IsOptional()
  @IsString()
  verifyToken?: string;
}

export class SendMobileCodeDto {
  @IsOptional()
  @IsString()
  @MinLength(11, { message: "手机号长度不能少于11位" })
  @MaxLength(14, { message: "手机号长度不能超过14位" })
  @Matches(/^(86)?1[3-9]\d{9,10}$/, { message: "手机号格式不正确" })
  mobile?: string;

  @IsOptional()
  // @IsEmail({}, { message: "邮箱格式不正确" })
  email?: string;

  @IsString()
  @IsOptional()
  event?: string = "login";

  @IsString()
  verifyToken: string;

  async validate() {
    if (!this.mobile && !this.email) {
      throw new Error("手机号和邮箱至少需要提供一个");
    }
  }
}

export class SendEmailCodeDto {
  @IsOptional()
  // @IsEmail({}, { message: "邮箱格式不正确" })
  email?: string;

  @IsString()
  @IsOptional()
  event?: string = "register_code";

  @IsString()
  verify_token: string;
}
