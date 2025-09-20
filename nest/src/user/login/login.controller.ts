// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoginService } from './login.service';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('User Authentication')
@Controller('api')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  /**
   * 获取快捷登录设置 - 对齐PHP版本 user/Login/getQuickLoginSetting
   */
  @Get('user/login/getQuickLoginSetting')
  @Public()
  @ApiOperation({ summary: '获取快捷登录设置' })
  async getQuickLoginSetting(@Request() req) {
    const clientType = this.loginService.getClientType(req);
    return this.loginService.getQuickLoginSetting(clientType);
  }

  /**
   * 用户登录 - 对齐PHP版本 user/Login/signin
   */
  @Post('user/login/signin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  async signin(@Body() loginData: any, @Request() req) {
    const clientIp = req.ip;
    return this.loginService.signin(loginData, clientIp);
  }

  /**
   * 发送手机验证码 - 对齐PHP版本 user/Login/sendMobileCode
   */
  @Post('user/login/sendMobileCode')
  @Public()
  @ApiOperation({ summary: '发送手机验证码' })
  async sendMobileCode(@Body() body: { mobile: string; event: string }) {
    return this.loginService.sendMobileCode(body.mobile, body.event);
  }

  /**
   * 发送邮箱验证码 - 对齐PHP版本 user/Login/sendEmailCode
   */
  @Post('user/login/sendEmailCode')
  @Public()
  @ApiOperation({ summary: '发送邮箱验证码' })
  async sendEmailCode(@Body() body: { email: string; event: string }) {
    return this.loginService.sendEmailCode(body.email, body.event);
  }

  /**
   * 验证手机号 - 对齐PHP版本 user/Login/checkMobile
   */
  @Post('user/login/checkMobile')
  @Public()
  @ApiOperation({ summary: '验证手机号' })
  async checkMobile(@Body() body: { mobile: string; code: string }) {
    return this.loginService.checkMobile(body.mobile, body.code);
  }

  /**
   * 验证邮箱 - 对齐PHP版本 user/Login/checkEmail
   */
  @Post('user/login/checkEmail')
  @Public()
  @ApiOperation({ summary: '验证邮箱' })
  async checkEmail(@Body() body: { email: string; code: string }) {
    return this.loginService.checkEmail(body.email, body.code);
  }

  /**
   * 忘记密码 - 对齐PHP版本 user/Login/forgetPassword
   */
  @Post('user/login/forgetPassword')
  @Public()
  @ApiOperation({ summary: '忘记密码' })
  async forgetPassword(@Body() body: { mobile_key: string; password: string }) {
    return this.loginService.forgetPassword(body.mobile_key, body.password);
  }

  /**
   * 获取微信登录URL - 对齐PHP版本 user/Login/getWechatLoginUrl
   */
  @Get('user/login/getWechatLoginUrl')
  @Public()
  @ApiOperation({ summary: '获取微信登录URL' })
  async getWechatLoginUrl(@Query('url') redirectUrl: string) {
    return this.loginService.getWechatLoginUrl(redirectUrl);
  }

  /**
   * 通过微信code获取用户信息 - 对齐PHP版本 user/Login/getWechatLoginInfoByCode
   */
  @Post('user/login/getWechatLoginInfoByCode')
  @Public()
  @ApiOperation({ summary: '通过微信code获取用户信息' })
  async getWechatLoginInfoByCode(@Body() body: { code: string }) {
    return this.loginService.getWechatLoginInfoByCode(body.code);
  }

  /**
   * 绑定微信 - 对齐PHP版本 user/Login/bindWechat
   */
  @Post('user/login/bindWechat')
  @ApiBearerAuth()
  @ApiOperation({ summary: '绑定微信' })
  async bindWechat(@Request() req, @Body() body: { code: string }) {
    return this.loginService.bindWechat(req.user.userId, body.code);
  }

  /**
   * 解除绑定微信 - 对齐PHP版本 user/Login/unbindWechat
   */
  @Post('user/login/unbindWechat')
  @ApiBearerAuth()
  @ApiOperation({ summary: '解除绑定微信' })
  async unbindWechat(@Request() req) {
    return this.loginService.unbindWechat(req.user.userId);
  }

  /**
   * 绑定手机号 - 对齐PHP版本 user/Login/bindMobile
   */
  @Post('user/login/bindMobile')
  @Public()
  @ApiOperation({ summary: '绑定手机号' })
  async bindMobile(@Body() body: {
    mobile: string;
    mobile_code: string;
    password?: string;
    open_data?: any;
    referrer_user_id?: number;
  }) {
    return this.loginService.bindMobile(body);
  }

  /**
   * 微信服务端验证 - 对齐PHP版本 user/Login/wechatServerVerify
   */
  @Get('user/login/wechatServerVerify')
  @Public()
  @ApiOperation({ summary: '微信服务端验证' })
  async wechatServerVerify(@Query() query: any) {
    return this.loginService.wechatServerVerify(query);
  }

  /**
   * 处理微信消息 - 对齐PHP版本 user/Login/getWechatMessage
   */
  @Post('user/login/getWechatMessage')
  @Public()
  @ApiOperation({ summary: '处理微信消息' })
  async getWechatMessage(@Body() message: any) {
    return this.loginService.getWechatMessage(message);
  }

  /**
   * 微信事件处理 - 对齐PHP版本 user/Login/wechatEvent
   */
  @Get('user/login/wechatEvent')
  @Public()
  @ApiOperation({ summary: '微信事件处理' })
  async wechatEvent(@Query('key') key: string) {
    return this.loginService.wechatEvent(key);
  }

  /**
   * 获取用户手机号 - 对齐PHP版本 user/Login/getUserMobile
   */
  @Post('user/login/getUserMobile')
  @Public()
  @ApiOperation({ summary: '获取用户手机号' })
  async getUserMobile(@Body() body: { code: string }) {
    return this.loginService.getUserMobile(body.code);
  }

  /**
   * 更新用户OpenId - 对齐PHP版本 user/Login/updateUserOpenId
   */
  @Post('user/login/updateUserOpenId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户OpenId' })
  async updateUserOpenId(@Request() req, @Body() body: { code: string }) {
    return this.loginService.updateUserOpenId(req.user.userId, body.code);
  }

  /**
   * 获取JSSDK配置 - 对齐PHP版本 user/Login/getJsSdkConfig
   */
  @Get('user/login/getJsSdkConfig')
  @Public()
  @ApiOperation({ summary: '获取JSSDK配置' })
  async getJsSdkConfig(@Query('url') url: string) {
    return this.loginService.getJsSdkConfig(url);
  }
}
