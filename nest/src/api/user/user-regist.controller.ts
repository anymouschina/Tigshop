// @ts-nocheck
import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { UserRegistService } from "./user-regist.service";
import { RegistDto, SendEmailCodeDto } from "./dto/user-regist.dto";

@ApiTags("用户端注册")
@Controller("api/user/regist")
export class UserRegistController {
  constructor(private readonly userRegistService: UserRegistService) {}

  @Post("regist")
  @ApiOperation({ summary: "用户注册" })
  @ApiResponse({ status: 200, description: "注册成功" })
  async regist(@Body() registDto: RegistDto) {
    const user = await this.userRegistService.regist(registDto);
    return {
      code: 200,
      message: "注册成功",
      data: user,
    };
  }

  @Post("sendEmailCode")
  @ApiOperation({ summary: "发送邮箱验证码" })
  @ApiResponse({ status: 200, description: "发送成功" })
  async sendEmailCode(@Body() sendEmailCodeDto: SendEmailCodeDto) {
    const result = await this.userRegistService.sendEmailCode(
      sendEmailCodeDto.email,
    );
    return {
      code: 200,
      message: result.message,
      data: null,
    };
  }

  @Get("checkUsername")
  @ApiOperation({ summary: "检查用户名是否可用" })
  @ApiQuery({ name: "username", description: "用户名" })
  @ApiResponse({ status: 200, description: "检查成功" })
  async checkUsername(@Query("username") username: string) {
    const exists = await this.userRegistService.checkUsernameExists(username);
    return {
      code: 200,
      message: "检查成功",
      data: {
        available: !exists,
      },
    };
  }

  @Get("checkMobile")
  @ApiOperation({ summary: "检查手机号是否可用" })
  @ApiQuery({ name: "mobile", description: "手机号" })
  @ApiResponse({ status: 200, description: "检查成功" })
  async checkMobile(@Query("mobile") mobile: string) {
    const exists = await this.userRegistService.checkMobileExists(mobile);
    return {
      code: 200,
      message: "检查成功",
      data: {
        available: !exists,
      },
    };
  }

  @Get("checkEmail")
  @ApiOperation({ summary: "检查邮箱是否可用" })
  @ApiQuery({ name: "email", description: "邮箱" })
  @ApiResponse({ status: 200, description: "检查成功" })
  async checkEmail(@Query("email") email: string) {
    const exists = await this.userRegistService.checkEmailExists(email);
    return {
      code: 200,
      message: "检查成功",
      data: {
        available: !exists,
      },
    };
  }
}
