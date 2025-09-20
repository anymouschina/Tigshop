// @ts-nocheck
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { CsrfService } from './services/csrf.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
  ) {}

  /**
   * 获取CSRF Token - 对齐PHP版本行为验证
   */
  @Get('csrf-token')
  @Public()
  @ApiOperation({ summary: '获取CSRF Token' })
  async getCsrfToken() {
    const token = this.csrfService.generateToken();
    return {
      status: 'success',
      data: {
        token,
      },
    };
  }

  /**
   * 用户注册 - 对齐PHP版本 user/register
   */
  @Post('register')
  @Public()
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * 用户登录 - 对齐PHP版本 user/login
   */
  @Post('login')
  @Public()
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * 忘记密码 - 对齐PHP版本 user/forgot-password
   */
  @Post('forgot-password')
  @Public()
  @ApiOperation({ summary: '忘记密码' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * 重置密码 - 对齐PHP版本 user/reset-password
   */
  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: '重置密码' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * 获取当前用户信息 - 对齐PHP版本 user/info
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  /**
   * 修改密码 - 对齐PHP版本 user/change-password
   */
  @Put('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.userId,
      changePasswordDto,
    );
  }

  /**
   * 刷新令牌 - 对齐PHP版本 user/refresh-token
   */
  @Post('refresh-token')
  @Public()
  @ApiOperation({ summary: '刷新令牌' })
  async refreshTokenV1(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  /**
   * 验证邮箱 - 对齐PHP版本 user/verify-email
   */
  @Post('verify-email')
  @Public()
  @ApiOperation({ summary: '验证邮箱' })
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  /**
   * 发送验证邮件 - 对齐PHP版本 user/send-verification-email
   */
  @Post('send-verification-email')
  @ApiBearerAuth()
  @ApiOperation({ summary: '发送验证邮件' })
  async sendVerificationEmail(@Request() req) {
    return this.authService.sendVerificationEmail(req.user.userId);
  }

  /**
   * 检查用户名是否可用 - 对齐PHP版本 user/check-username
   */
  @Get('check-username')
  @Public()
  @ApiOperation({ summary: '检查用户名是否可用' })
  async checkUsername(@Request() req) {
    const username = req.query.username as string;
    return this.authService.checkUsername(username);
  }

  /**
   * 检查邮箱是否可用 - 对齐PHP版本 user/check-email
   */
  @Get('check-email')
  @Public()
  @ApiOperation({ summary: '检查邮箱是否可用' })
  async checkEmail(@Request() req) {
    const email = req.query.email as string;
    return this.authService.checkEmail(email);
  }

  /**
   * 检查手机号是否可用 - 对齐PHP版本 user/check-mobile
   */
  @Get('check-mobile')
  @Public()
  @ApiOperation({ summary: '检查手机号是否可用' })
  async checkMobile(@Request() req) {
    const mobile = req.query.mobile as string;
    return this.authService.checkMobile(mobile);
  }

  /**
   * 绑定手机号 - 对齐PHP版本 user/bind-mobile
   */
  @Post('bind-mobile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '绑定手机号' })
  async bindMobile(@Request() req, @Body() body: { mobile: string; code: string }) {
    return this.authService.bindMobile(req.user.userId, body.mobile, body.code);
  }

  /**
   * 解绑手机号 - 对齐PHP版本 user/unbind-mobile
   */
  @Delete('unbind-mobile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '解绑手机号' })
  async unbindMobile(@Request() req) {
    return this.authService.unbindMobile(req.user.userId);
  }

  /**
   * 发送短信验证码 - 对齐PHP版本 user/send-sms-code
   */
  @Post('send-sms-code')
  @Public()
  @ApiOperation({ summary: '发送短信验证码' })
  async sendSmsCode(@Body() body: { mobile: string; type: string }) {
    return this.authService.sendSmsCode(body.mobile, body.type);
  }

  /**
   * 验证短信验证码 - 对齐PHP版本 user/verify-sms-code
   */
  @Post('verify-sms-code')
  @Public()
  @ApiOperation({ summary: '验证短信验证码' })
  async verifySmsCode(@Body() body: { mobile: string; code: string; type: string }) {
    return this.authService.verifySmsCode(body.mobile, body.code, body.type);
  }

  /**
   * 刷新Token
   */
  @Post('refresh')
  @Public()
  @ApiOperation({ summary: '刷新Token' })
  async refreshTokenV2(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * 获取用户信息
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  async getProfileAlias(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  /**
   * 获取用户权限 - 对齐PHP版本 user/permissions
   */
  @Get('permissions')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户权限' })
  async getPermissions(@Request() req) {
    return this.authService.getPermissions(req.user.userId);
  }

  /**
   * 用户登出 - 对齐PHP版本 user/logout
   */
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(req.user.userId, token);
  }

  /**
   * 更新用户信息
   */
  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户信息' })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, updateProfileDto);
  }

  /**
   * 修改密码
   */
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  async changePasswordAlias(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }
}
