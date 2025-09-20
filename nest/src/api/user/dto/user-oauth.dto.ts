// @ts-nocheck
import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';

export enum OAuthProvider {
  WECHAT = 'wechat',
  QQ = 'qq',
  WEIBO = 'weibo',
  ALIPAY = 'alipay',
}

export class OAuthCallbackDto {
  @IsString()
  code: string;

  @IsString()
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class OAuthUrlDto {
  @IsString()
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class OAuthUserInfoDto {
  @IsString()
  openid: string;

  @IsString()
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  unionid?: string;
}
