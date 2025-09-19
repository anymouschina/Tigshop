import { Injectable, OnModuleInit, Inject, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { Cron } from '@nestjs/schedule';
import { RegisterDto, LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: number;      // User ID
  openId?: string;  // WeChat openId
  name?: string;    // Username
  email?: string;   // Email address
  iat?: number;     // Issued at
  exp?: number;     // Expiration time
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('CONFIG') private readonly config: any,
    private readonly databaseService: DatabaseService,
  ) {}

  async onModuleInit() {
    // Clean up expired blacklisted tokens on startup
    await this.cleanupExpiredTokens();
  }

  /**
   * Generate a JWT token for a user
   * 
   * @param userId User ID
   * @param payload Additional payload data
   * @returns JWT token string
   */
  async generateToken(userId: number, payload: Partial<JwtPayload> = {}): Promise<string> {
    const tokenPayload: JwtPayload = {
      sub: userId,
      ...payload,
    };

    return this.jwtService.sign(tokenPayload);
  }

  /**
   * Verify and decode a JWT token
   * 
   * @param token JWT token string
   * @returns Decoded payload or null if invalid
   */
  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      // Check if the token is blacklisted
      const blacklistedToken = await this.databaseService.blacklistedToken.findUnique({
        where: { token },
      });
      
      if (blacklistedToken) {
        return null;
      }
      
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Blacklist a token (logout)
   * 
   * @param token JWT token string
   * @param userId User ID
   * @returns True if token was blacklisted, false otherwise
   */
  async blacklistToken(token: string, userId: number): Promise<boolean> {
    try {
      // Decode token without verifying to get expiration time
      const decoded = this.jwtService.decode(token) as JwtPayload;
      
      if (!decoded || !decoded.exp) {
        return false;
      }
      
      // Convert exp timestamp to Date object
      const expiresAt = new Date(decoded.exp * 1000);
      
      // Add token to blacklist
      await this.databaseService.blacklistedToken.create({
        data: {
          token,
          userId,
          expiresAt,
        },
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Hash password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Validate password against hash
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if password matches, false otherwise
   */
  async validatePassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  /**
   * Clean up expired blacklisted tokens
   * Runs every day at midnight
   */
  @Cron('0 0 * * *')
  async cleanupExpiredTokens() {
    const now = new Date();

    await this.databaseService.blacklistedToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
  }

  /**
   * 用户注册 - 对齐PHP版本 user/register
   */
  async register(registerDto: RegisterDto) {
    // 检查用户名是否已存在
    const existingUser = await this.databaseService.user.findFirst({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在
    if (registerDto.email) {
      const existingEmail = await this.databaseService.user.findFirst({
        where: { email: registerDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 检查手机号是否已存在
    if (registerDto.mobile) {
      const existingMobile = await this.databaseService.user.findFirst({
        where: { mobile: registerDto.mobile },
      });

      if (existingMobile) {
        throw new ConflictException('手机号已存在');
      }
    }

    // 密码加密
    const hashedPassword = await this.hashPassword(registerDto.password);

    // 创建用户
    const user = await this.databaseService.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        mobile: registerDto.mobile,
        nickname: registerDto.nickname || registerDto.username,
        password: hashedPassword,
        avatar: registerDto.avatar,
        status: 1,
        isEnable: true,
        regTime: new Date(),
        lastLogin: new Date(),
        balance: 0,
        points: 0,
        frozenBalance: 0,
        growthPoints: 0,
        addressId: 0,
        rankId: 0,
        referrerUserId: 0,
        fromTag: 0,
        isSvip: 0,
        svipExpireTime: new Date(),
        orderCount: 0,
        orderAmount: 0,
        isDistribution: 0,
        wechatImg: '',
        isCompanyAuth: 0,
      },
    });

    // 生成JWT令牌
    const token = await this.generateToken(user.userId, {
      name: user.username,
      email: user.email,
    });

    return {
      success: true,
      message: '注册成功',
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        mobile: user.mobile,
        token,
      },
    };
  }

  /**
   * 用户登录 - 对齐PHP版本 user/login
   */
  async login(loginDto: LoginDto) {
    // 查找用户
    const user = await this.databaseService.user.findFirst({
      where: {
        OR: [
          { username: loginDto.username },
          { email: loginDto.username },
          { mobile: loginDto.username },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查用户状态
    if (!user.isEnable || user.status !== 1) {
      throw new BadRequestException('用户已被禁用');
    }

    // 验证密码
    const isValidPassword = await this.validatePassword(loginDto.password, user.password);
    if (!isValidPassword) {
      throw new BadRequestException('密码错误');
    }

    // 更新最后登录时间
    await this.databaseService.user.update({
      where: { userId: user.userId },
      data: {
        lastLogin: new Date(),
      },
    });

    // 生成JWT令牌
    const token = await this.generateToken(user.userId, {
      name: user.username,
      email: user.email,
    });

    return {
      success: true,
      message: '登录成功',
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        mobile: user.mobile,
        balance: user.balance,
        points: user.points,
        token,
      },
    };
  }

  /**
   * 获取用户信息 - 对齐PHP版本 user/info
   */
  async getProfile(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        email: true,
        mobile: true,
        nickname: true,
        avatar: true,
        balance: true,
        points: true,
        growthPoints: true,
        rankId: true,
        isSvip: true,
        svipExpireTime: true,
        orderCount: true,
        orderAmount: true,
        status: true,
        isEnable: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      success: true,
      data: user,
    };
  }

  /**
   * 修改密码 - 对齐PHP版本 user/change-password
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证当前密码
    const isValidPassword = await this.validatePassword(changePasswordDto.currentPassword, user.password);
    if (!isValidPassword) {
      throw new BadRequestException('当前密码错误');
    }

    // 验证新密码确认
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('新密码确认不匹配');
    }

    // 加密新密码
    const hashedPassword = await this.hashPassword(changePasswordDto.newPassword);

    // 更新密码
    await this.databaseService.user.update({
      where: { userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: '密码修改成功',
    };
  }

  /**
   * 忘记密码 - 对齐PHP版本 user/forgot-password
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.databaseService.user.findFirst({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('邮箱不存在');
    }

    // 生成重置令牌
    const resetToken = await this.generateToken(user.userId, { email: user.email });

    // 这里应该发送邮件，暂时返回令牌用于测试
    return {
      success: true,
      message: '重置密码邮件已发送',
      data: {
        resetToken,
      },
    };
  }

  /**
   * 重置密码 - 对齐PHP版本 user/reset-password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // 验证重置令牌
    const payload = await this.verifyToken(resetPasswordDto.token);
    if (!payload) {
      throw new BadRequestException('重置令牌无效');
    }

    // 验证新密码确认
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('新密码确认不匹配');
    }

    // 加密新密码
    const hashedPassword = await this.hashPassword(resetPasswordDto.newPassword);

    // 更新密码
    await this.databaseService.user.update({
      where: { userId: payload.sub },
      data: { password: hashedPassword },
    });

    // 将重置令牌加入黑名单
    await this.blacklistToken(resetPasswordDto.token, payload.sub);

    return {
      success: true,
      message: '密码重置成功',
    };
  }

  /**
   * 用户登出 - 对齐PHP版本 user/logout
   */
  async logout(userId: number, authorization: string) {
    const token = authorization?.replace('Bearer ', '');
    if (token) {
      await this.blacklistToken(token, userId);
    }

    return {
      success: true,
      message: '登出成功',
    };
  }

  /**
   * 刷新令牌 - 对齐PHP版本 user/refresh-token
   */
  async refreshToken(refreshToken: string) {
    const payload = await this.verifyToken(refreshToken);
    if (!payload) {
      throw new BadRequestException('刷新令牌无效');
    }

    // 生成新的访问令牌
    const newToken = await this.generateToken(payload.sub, {
      name: payload.name,
      email: payload.email,
    });

    return {
      success: true,
      data: {
        token: newToken,
      },
    };
  }

  /**
   * 验证邮箱 - 对齐PHP版本 user/verify-email
   */
  async verifyEmail(token: string) {
    const payload = await this.verifyToken(token);
    if (!payload) {
      throw new BadRequestException('验证令牌无效');
    }

    await this.databaseService.user.update({
      where: { userId: payload.sub },
      data: { emailValidated: 1 },
    });

    return {
      success: true,
      message: '邮箱验证成功',
    };
  }

  /**
   * 发送验证邮件 - 对齐PHP版本 user/send-verification-email
   */
  async sendVerificationEmail(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 生成验证令牌
    const verificationToken = await this.generateToken(userId, { email: user.email });

    // 这里应该发送邮件，暂时返回令牌用于测试
    return {
      success: true,
      message: '验证邮件已发送',
      data: {
        verificationToken,
      },
    };
  }

  /**
   * 检查用户名是否可用 - 对齐PHP版本 user/check-username
   */
  async checkUsername(username: string) {
    if (!username || username.length < 3) {
      throw new BadRequestException('用户名长度至少3个字符');
    }

    const existingUser = await this.databaseService.user.findFirst({
      where: { username },
    });

    return {
      success: true,
      data: {
        isAvailable: !existingUser,
      },
    };
  }

  /**
   * 检查邮箱是否可用 - 对齐PHP版本 user/check-email
   */
  async checkEmail(email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('邮箱格式不正确');
    }

    const existingUser = await this.databaseService.user.findFirst({
      where: { email },
    });

    return {
      success: true,
      data: {
        isAvailable: !existingUser,
      },
    };
  }

  /**
   * 检查手机号是否可用 - 对齐PHP版本 user/check-mobile
   */
  async checkMobile(mobile: string) {
    if (!mobile || mobile.length < 11) {
      throw new BadRequestException('手机号格式不正确');
    }

    const existingUser = await this.databaseService.user.findFirst({
      where: { mobile },
    });

    return {
      success: true,
      data: {
        isAvailable: !existingUser,
      },
    };
  }

  /**
   * 绑定手机号 - 对齐PHP版本 user/bind-mobile
   */
  async bindMobile(userId: number, mobile: string, code: string) {
    // 这里应该验证短信验证码，暂时跳过验证
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查手机号是否已被其他用户使用
    const existingMobile = await this.databaseService.user.findFirst({
      where: { mobile, userId: { not: userId } },
    });

    if (existingMobile) {
      throw new BadRequestException('手机号已被其他用户使用');
    }

    // 更新手机号
    await this.databaseService.user.update({
      where: { userId },
      data: {
        mobile,
        mobileValidated: 1,
      },
    });

    return {
      success: true,
      message: '手机号绑定成功',
    };
  }

  /**
   * 解绑手机号 - 对齐PHP版本 user/unbind-mobile
   */
  async unbindMobile(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.databaseService.user.update({
      where: { userId },
      data: {
        mobile: '',
        mobileValidated: 0,
      },
    });

    return {
      success: true,
      message: '手机号解绑成功',
    };
  }

  /**
   * 发送短信验证码 - 对齐PHP版本 user/send-sms-code
   */
  async sendSmsCode(mobile: string, type: string) {
    // 这里应该发送短信验证码，暂时返回成功
    return {
      success: true,
      message: '短信验证码已发送',
      data: {
        code: '123456', // 测试用，实际应该从缓存或数据库获取
      },
    };
  }

  /**
   * 验证短信验证码 - 对齐PHP版本 user/verify-sms-code
   */
  async verifySmsCode(mobile: string, code: string, type: string) {
    // 这里应该验证短信验证码，暂时只验证测试码
    if (code !== '123456') {
      throw new BadRequestException('验证码错误');
    }

    return {
      success: true,
      message: '验证码验证成功',
    };
  }
} 