// @ts-nocheck
import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UserAuthService } from "./auth.service";
import { Public } from "../../auth/decorators/public.decorator";
import {
  LoginDto,
  RegisterDto,
  ForgetPasswordDto,
  SendMobileCodeDto,
  SendEmailCodeDto,
  CheckMobileCodeDto,
  CheckEmailCodeDto,
  WechatLoginUrlDto,
  WechatLoginByCodeDto,
  BindWechatDto,
  BindMobileDto,
  WechatEventDto,
  GetUserMobileDto,
  UpdateUserOpenIdDto,
  JsSdkConfigDto,
  QuickLoginSettingResponse,
} from "./dto/auth.dto";

@ApiTags("User Authentication")
@Controller("api/user")
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  /**
   * 获取快捷登录设置
   */
  @Get("login/getQuickLoginSetting")
  @Public()
  @ApiOperation({ summary: "获取快捷登录设置" })
  async getQuickLoginSetting(): Promise<QuickLoginSettingResponse> {
    return this.userAuthService.getQuickLoginSetting();
  }

  /**
   * 用户登录
   */
  @Post("login/signin")
  @Public()
  @ApiOperation({ summary: "用户登录" })
  async login(@Body() loginDto: LoginDto) {
    return this.userAuthService.login(loginDto);
  }

  /**
   * 用户注册
   */
  @Post("regist/registAct")
  @Public()
  @ApiOperation({ summary: "用户注册" })
  async register(@Body() registerDto: RegisterDto) {
    return this.userAuthService.register(registerDto);
  }

  /**
   * 发送手机验证码
   */
  @Post("login/sendMobileCode")
  @Public()
  @ApiOperation({ summary: "发送手机验证码" })
  async sendMobileCode(@Body() sendMobileCodeDto: SendMobileCodeDto) {
    return this.userAuthService.sendMobileCode(sendMobileCodeDto);
  }

  /**
   * 发送邮箱验证码
   */
  @Post("login/sendEmailCode")
  @Public()
  @ApiOperation({ summary: "发送邮箱验证码" })
  async sendEmailCode(@Body() sendEmailCodeDto: SendEmailCodeDto) {
    return this.userAuthService.sendEmailCode(sendEmailCodeDto);
  }

  /**
   * 验证手机验证码
   */
  @Post("login/checkMobile")
  @Public()
  @ApiOperation({ summary: "验证手机验证码" })
  async checkMobile(@Body() checkMobileCodeDto: CheckMobileCodeDto) {
    return this.userAuthService.checkMobileCode(checkMobileCodeDto);
  }

  /**
   * 验证邮箱验证码
   */
  @Post("login/checkEmail")
  @Public()
  @ApiOperation({ summary: "验证邮箱验证码" })
  async checkEmail(@Body() checkEmailCodeDto: CheckEmailCodeDto) {
    return this.userAuthService.checkEmailCode(checkEmailCodeDto);
  }

  /**
   * 忘记密码
   */
  @Post("login/forgetPassword")
  @Public()
  @ApiOperation({ summary: "忘记密码" })
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.userAuthService.forgetPassword(forgetPasswordDto);
  }

  /**
   * 获取微信登录URL
   */
  @Get("login/getWechatLoginUrl")
  @Public()
  @ApiOperation({ summary: "获取微信登录URL" })
  async getWechatLoginUrl(@Query() wechatLoginUrlDto: WechatLoginUrlDto) {
    return this.userAuthService.getWechatLoginUrl(wechatLoginUrlDto);
  }

  /**
   * 通过微信code登录
   */
  @Post("login/getWechatLoginInfoByCode")
  @Public()
  @ApiOperation({ summary: "通过微信code登录" })
  async getWechatLoginInfoByCode(
    @Body() wechatLoginByCodeDto: WechatLoginByCodeDto,
  ) {
    return this.userAuthService.wechatLoginByCode(wechatLoginByCodeDto);
  }

  /**
   * 绑定微信
   */
  @Post("login/bindWechat")
  @ApiBearerAuth()
  @ApiOperation({ summary: "绑定微信" })
  async bindWechat(@Request() req, @Body() bindWechatDto: BindWechatDto) {
    return this.userAuthService.bindWechat(bindWechatDto, req.user.userId);
  }

  /**
   * 解绑微信
   */
  @Post("login/unbindWechat")
  @ApiBearerAuth()
  @ApiOperation({ summary: "解绑微信" })
  async unbindWechat(@Request() req) {
    return this.userAuthService.unbindWechat(req.user.userId);
  }

  /**
   * 绑定手机号
   */
  @Post("login/bindMobile")
  @Public()
  @ApiOperation({ summary: "绑定手机号" })
  async bindMobile(@Body() bindMobileDto: BindMobileDto) {
    return this.userAuthService.bindMobile(bindMobileDto);
  }

  /**
   * 处理微信扫码事件
   */
  @Get("login/wechatEvent")
  @Public()
  @ApiOperation({ summary: "处理微信扫码事件" })
  async wechatEvent(@Query() wechatEventDto: WechatEventDto) {
    return this.userAuthService.handleWechatEvent(wechatEventDto);
  }

  /**
   * 获取用户手机号（小程序）
   */
  @Post("login/getUserMobile")
  @Public()
  @ApiOperation({ summary: "获取用户手机号（小程序）" })
  async getUserMobile(@Body() getUserMobileDto: GetUserMobileDto) {
    return this.userAuthService.getUserMobile(getUserMobileDto);
  }

  /**
   * 更新用户openid
   */
  @Post("login/updateUserOpenId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "更新用户openid" })
  async updateUserOpenId(
    @Request() req,
    @Body() updateUserOpenIdDto: UpdateUserOpenIdDto,
  ) {
    return this.userAuthService.updateUserOpenId(
      updateUserOpenIdDto,
      req.user.userId,
    );
  }

  /**
   * 获取JSSDK配置
   */
  @Get("login/getJsSdkConfig")
  @Public()
  @ApiOperation({ summary: "获取JSSDK配置" })
  async getJsSdkConfig(@Query() jsSdkConfigDto: JsSdkConfigDto) {
    return this.userAuthService.getJsSdkConfig(jsSdkConfigDto);
  }
}
