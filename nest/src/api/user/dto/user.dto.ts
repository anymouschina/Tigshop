// @ts-nocheck
import {
  IsString,
  IsEmail,
  IsMobilePhone,
  IsOptional,
  IsNumber,
  IsEnum,
  MinLength,
  IsDateString,
} from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsEmail({}, { message: "邮箱格式不正确" })
  email?: string;

  @IsOptional()
  @IsMobilePhone("zh-CN", { message: "手机号格式不正确" })
  mobile?: string;

  @IsOptional()
  @IsString()
  wechat_img?: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsEnum(["male", "female", "secret"])
  gender?: "male" | "female" | "secret";
}

export class UpdatePasswordDto {
  @IsString()
  old_password: string;

  @IsString()
  @MinLength(6, { message: "新密码长度至少6位" })
  new_password: string;

  @IsString()
  confirm_password: string;
}

export class UpdateMobileDto {
  @IsMobilePhone("zh-CN", { message: "新手机号格式不正确" })
  new_mobile: string;

  @IsString()
  code: string;
}

export class UpdateEmailDto {
  @IsEmail({}, { message: "新邮箱格式不正确" })
  new_email: string;

  @IsString()
  code: string;
}

export class UploadAvatarDto {
  @IsString()
  avatar: string;
}

export class UserQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 10;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  sort_field?: string = "user_id";

  @IsOptional()
  @IsString()
  sort_order?: string = "desc";
}
