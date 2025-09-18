import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '邮箱地址', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '用户名或邮箱', required: false })
  @IsOptional()
  @IsString()
  usernameOrEmail?: string;

  @ApiProperty({ description: '密码' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;

  @ApiProperty({ description: '微信授权码', required: false })
  @IsOptional()
  @IsString()
  code?: string;
}