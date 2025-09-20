// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class EmailLoginDto {
  @ApiProperty({ description: "邮箱地址" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "密码" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
