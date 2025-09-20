import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserLoginService } from './user-login.service';
import {
  LoginDto,
  SendMobileCodeDto,
  CheckMobileDto,
  CheckEmailDto,
  ForgetPasswordDto,
  BindMobileDto,
  BindWechatDto,
  GetWxLoginUrlDto,
  WxLoginInfoDto,
  SendEmailCodeDto,
} from './dto/user-login.dto';

@ApiTags('用户端登录')
@Controller('api/user/login')
export class UserLoginController {
  constructor(private readonly userLoginService: UserLoginService) {}

  @Get('getQuickLoginSetting')
  @ApiOperation({ summary: '获取快捷登录设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getQuickLoginSetting() {
    return this.userLoginService.getQuickLoginSetting();
  }

  @Post('signin')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  async signin(@Body() loginDto: LoginDto) {
    return this.userLoginService.login(loginDto);
  }

  @Post('sendMobileCode')
  @ApiOperation({ summary: '发送手机验证码' })
  @ApiResponse({ status: 200, description: '发送成功' })
  async sendMobileCode(@Body() body: SendMobileCodeDto) {
    return this.userLoginService.sendMobileCode(body.mobile, body.type);
  }

  @Post('checkMobile')
  @ApiOperation({ summary: '验证手机号' })
  @ApiResponse({ status: 200, description: '验证成功' })
  async checkMobile(@Body() body: CheckMobileDto) {
    return this.userLoginService.checkMobile(body.mobile);
  }

  @Post('checkEmail')
  @ApiOperation({ summary: '验证邮箱' })
  @ApiResponse({ status: 200, description: '验证成功' })
  async checkEmail(@Body() body: CheckEmailDto) {
    return this.userLoginService.checkEmail(body.email);
  }

  @Post('forgetPassword')
  @ApiOperation({ summary: '忘记密码' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async forgetPassword(@Body() body: ForgetPasswordDto) {
    return this.userLoginService.forgetPassword(body);
  }

  @Get('getWxLoginUrl')
  @ApiOperation({ summary: '获取微信登录URL' })
  @ApiQuery({ name: 'redirect_url', required: false, description: '回调地址' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWxLoginUrl(@Query() query: GetWxLoginUrlDto) {
    return this.userLoginService.getWechatLoginUrl(query.redirect_url);
  }

  @Get('getWxLoginInfoByCode')
  @ApiOperation({ summary: '通过微信code获取用户信息' })
  @ApiQuery({ name: 'code', required: true, description: '微信授权码' })
  @ApiQuery({ name: 'state', required: false, description: '状态参数' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWxLoginInfoByCode(@Query() query: { code: string; state?: string }) {
    return this.userLoginService.getWechatLoginInfoByCode(query.code, query.state);
  }

  @Post('bindMobile')
  @ApiOperation({ summary: '第三方登录绑定手机号' })
  @ApiResponse({ status: 200, description: '绑定成功' })
  async bindMobile(@Body() body: BindMobileDto) {
    return this.userLoginService.bindMobile(body);
  }

  @Post('bindWechat')
  @ApiOperation({ summary: '绑定微信公众号' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '绑定成功' })
  async bindWechat(@Request() req, @Body() body: BindWechatDto) {
    const userId = req.user.userId;
    return this.userLoginService.bindWechat(userId, body);
  }

  @Get('unbindWechat')
  @ApiOperation({ summary: '解绑微信公众号' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '解绑成功' })
  async unbindWechat(@Request() req) {
    const userId = req.user.userId;
    return this.userLoginService.unbindWechat(userId);
  }

  @Get('wechatServer')
  @ApiOperation({ summary: '微信服务器校验' })
  @ApiResponse({ status: 200, description: '校验成功' })
  async wechatServerVerify(@Query() query: any) {
    return this.userLoginService.wechatServerVerify(query);
  }

  @Post('wechatServer')
  @ApiOperation({ summary: '获取微信推送消息' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async getWechatMessage(@Body() body: any) {
    return this.userLoginService.getWechatMessage(body);
  }

  @Post('wechatEvent')
  @ApiOperation({ summary: '检测微信用户操作事件' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async wechatEvent(@Body() body: any) {
    return this.userLoginService.wechatEvent(body);
  }

  @Post('getMobile')
  @ApiOperation({ summary: '获取手机号' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserMobile(@Body() body: any) {
    return this.userLoginService.getUserMobile(body);
  }

  @Post('updateUserOpenId')
  @ApiOperation({ summary: '更新用户OpenId' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserOpenId(@Request() req, @Body() body: { open_id: string }) {
    const userId = req.user.userId;
    return this.userLoginService.updateUserOpenId(userId, body.open_id);
  }

  @Post('getJsSdkConfig')
  @ApiOperation({ summary: '获取JSSDK配置' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  async getJsSdkConfig(@Request() req, @Body() body: { url: string }) {
    const userId = req.user.userId;
    return this.userLoginService.getJsSdkConfig(userId, body.url);
  }

  @Post('sendEmailCode')
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({ status: 200, description: '发送成功' })
  async sendEmailCode(@Body() body: SendEmailCodeDto) {
    return this.userLoginService.sendEmailCode(body.email, body.type);
  }
}