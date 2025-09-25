// @ts-nocheck
import {
  Injectable,
  OnModuleInit,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { Cron } from "@nestjs/schedule";
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LoginType,
  RegisterType,
  UpdateProfileDto,
} from "./dto/auth.dto";
import { CsrfService } from "./services/csrf.service";
import { CaptchaService } from "./services/captcha.service";
import { UsernameGeneratorService } from "./services/username-generator.service";
import { VerificationCodeService } from "./services/verification-code.service";
import { RedisService } from "../redis/redis.service";
import { PrismaService } from "src/prisma/prisma.service";

export interface JwtPayload {
  sub: number; // User ID
  openId?: string; // WeChat openId
  name?: string; // Username
  email?: string; // Email address
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JwtService,
    @Inject("CONFIG") private readonly config: any,
    private readonly databaseService: PrismaService,
    private readonly csrfService: CsrfService,
    private readonly captchaService: CaptchaService,
    private readonly usernameGeneratorService: UsernameGeneratorService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    // Clean up expired blacklisted tokens on startup
    await this.cleanupExpiredTokens();
  }

  /**
   * Generate a JWT token for a user (NestJS standard format)
   *
   * @param userId User ID
   * @param payload Additional payload data
   * @returns JWT token string
   */
  async generateToken(
    userId: number,
    payload: Partial<JwtPayload> = {},
  ): Promise<string> {
    const tokenPayload: JwtPayload = {
      sub: userId,
      ...payload,
    };

    return this.jwtService.sign(tokenPayload);
  }

  /**
   * Generate PHP-compatible JWT token
   * Matches PHP JWT structure exactly
   *
   * @param userId User ID
   * @param expirationSeconds Optional expiration time in seconds (default: 15 days)
   * @returns JWT token string
   */
  async generateTokenPhpCompatible(
    userId: number,
    expirationSeconds: number = 3600 * 24 * 15,
  ): Promise<string> {
    const uuid = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: "lyecs@2023",
      aud: "",
      iat: now,
      nbf: now,
      exp: now + expirationSeconds, // Default: 15 days
      data: {
        appId: userId,
        uuid: uuid,
      },
    };

    const token = this.jwtService.sign(payload, {
      secret: "lyecs@2023",
      algorithm: "HS256",
      // Note: Don't set expiresIn when manually setting exp property
    });

    // Store token in cache for validation (in real implementation, use Redis)
    await this.cacheToken(uuid, token);

    return token;
  }

  private async cacheToken(uuid: string, token: string): Promise<void> {
    // In real implementation, use Redis. For now, we'll simulate with in-memory storage
    // This would be: await this.redisService.set(`app:appId:${uuid}`, token, 3600 * 24 * 15);
    this.logger.debug(`Token cached for UUID: ${uuid}`);
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
      const blacklistedToken =
        await this.databaseService.blacklistedToken.findUnique({
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
    return bcrypt.hash(password, 10);
  }

  /**
   * Validate password against hash
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if password matches, false otherwise
   */
  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Clean up expired blacklisted tokens
   * Runs every day at midnight
   */
  @Cron("0 0 * * *")
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
   * 支持手机注册和邮箱注册
   */
  async register(registerDto: RegisterDto) {
    // 根据注册类型进行不同的验证
    switch (registerDto.regist_type) {
      case RegisterType.MOBILE:
        return this.registerWithMobile(registerDto);
      case RegisterType.EMAIL:
        return this.registerWithEmail(registerDto);
      default:
        // throw new BadRequestException("不支持的注册类型");
        return this.registerWithMobile(registerDto);
    }
  }

  /**
   * 手机号注册
   */
  private async registerWithMobile(registerDto: RegisterDto) {
    // 验证必填字段
    if (!registerDto.mobile) {
      throw new BadRequestException("手机号不能为空");
    }

    if (!registerDto.mobile_code) {
      throw new BadRequestException("手机验证码不能为空");
    }

    // 验证手机验证码 - 使用与LoginService一致的Redis验证方式
    const isValidMobileCode = await this.validateMobileCodeFromRedis(
      registerDto.mobile,
      registerDto.mobile_code,
    );
    this.logger.debug(`====>isValidMobileCode ${isValidMobileCode}`);
    if (!isValidMobileCode) {
      throw new BadRequestException("手机验证码错误或已过期");
    }

    // 检查手机号是否已存在
    const existingMobile = await this.databaseService.user.findFirst({
      where: { mobile: registerDto.mobile },
    });

    if (existingMobile) {
      throw new ConflictException("手机号已存在");
    }

    return this.createUser(registerDto, { mobileValidated: 1 });
  }

  /**
   * 邮箱注册
   */
  private async registerWithEmail(registerDto: RegisterDto) {
    // 验证必填字段
    if (!registerDto.email) {
      throw new BadRequestException("邮箱不能为空");
    }

    if (!registerDto.email_code) {
      throw new BadRequestException("邮箱验证码不能为空");
    }

    // 验证邮箱验证码
    const isValidEmailCode =
      await this.verificationCodeService.validateEmailCode(
        registerDto.email,
        registerDto.email_code,
      );

    if (!isValidEmailCode) {
      throw new BadRequestException("邮箱验证码错误或已过期");
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.databaseService.user.findFirst({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException("邮箱已存在");
    }

    return this.createUser(registerDto, { emailValidated: 1 });
  }

  /**
   * 创建用户
   */
  private async createUser(
    registerDto: RegisterDto,
    validationFlags: { mobileValidated?: number; emailValidated?: number },
  ) {
    // 检查用户名是否存在（如果提供）
    let username = registerDto.username;
    if (username) {
      const existingUser = await this.databaseService.user.findFirst({
        where: { username },
      });

      if (existingUser) {
        throw new ConflictException("用户名已存在");
      }
    } else {
      // 自动生成用户名
      username = await this.usernameGeneratorService.generateUsername();
    }

    // 生成昵称（如果未提供）
    let nickname = registerDto.nickname;
    if (!nickname) {
      nickname = await this.usernameGeneratorService.generateNickname();
    }

    // 检查昵称是否已存在
    const existingNickname = await this.databaseService.user.findFirst({
      where: { nickname },
    });

    if (existingNickname) {
      nickname = await this.usernameGeneratorService.generateNickname();
    }

    // 密码加密
    const hashedPassword = await this.hashPassword(registerDto.password);

    // 创建用户数据（匹配PHP字段）
    const now = Math.floor(Date.now() / 1000); // Unix timestamp
    const userData: any = {
      username,
      password: hashedPassword,
      avatar: registerDto.avatar || "",
      mobile: registerDto.mobile || "",
      mobile_validated: validationFlags.mobileValidated || 0,
      email: registerDto.email || "",
      email_validated: validationFlags.emailValidated || 0,
      nickname,
      balance: 0,
      points: 0,
      growth_points: 0,
      reg_time: now,
      last_login: now,
      rank_id: 0,
      referrer_user_id: registerDto.referrer_user_id || 0,
      status: 1, // Active
    };

    // 创建用户
    const user = await this.databaseService.user.create({
      data: userData,
    });

    // 如果有销售员ID，创建销售员客户关系
    if (registerDto.salesman_id) {
      await this.createSalesmanCustomer(user.userId, registerDto.salesman_id);
    }

    // 生成PHP兼容的JWT令牌 (2小时过期)
    const token = await this.generateTokenPhpCompatible(user.userId, 3600 * 2);

    // 生成refresh token (30天过期)
    const refreshToken = await this.generateTokenPhpCompatible(
      user.userId,
      3600 * 24 * 30,
    );

    // PHP项目只返回token，不需要包装在status和data中
    return {
      token,
      refreshToken,
    };
  }

  /**
   * 创建销售员客户关系
   */
  private async createSalesmanCustomer(userId: number, salesmanId: number) {
    // TODO: 实现销售员客户关系创建逻辑
    // 这里需要在数据库中创建销售员客户记录
    this.logger.debug(
      `创建销售员客户关系: 用户ID ${userId}, 销售员ID ${salesmanId}`
    );
  }

  /**
   * 用户登录 - 对齐PHP版本 user/login
   */
  async login(loginDto: LoginDto) {
    let user;

    // CSRF token validation (if provided)
    if (loginDto.verify_token) {
      if (!this.csrfService.validateToken(loginDto.verify_token)) {
        throw new UnauthorizedException("CSRF token无效");
      }
      this.csrfService.deleteToken(loginDto.verify_token);
    }

    // 根据登录类型进行不同的验证
    switch (loginDto.login_type) {
      case LoginType.PASSWORD:
        user = await this.authenticateWithPassword(
          loginDto.username,
          loginDto.password,
        );
        break;

      case LoginType.MOBILE:
        user = await this.authenticateWithMobile(
          loginDto.mobile,
          loginDto.mobile_code,
        );
        break;

      case LoginType.EMAIL:
        user = await this.authenticateWithEmail(
          loginDto.email,
          loginDto.email_code,
        );
        break;

      default:
        throw new BadRequestException("不支持的登录类型");
    }

    // 检查用户状态
    if (!user.isEnable || user.status !== 1) {
      throw new BadRequestException("用户已被禁用");
    }

    // 更新最后登录时间
    await this.databaseService.user.update({
      where: { userId: user.userId },
      data: {
        lastLogin: new Date(),
      },
    });

    // 生成PHP兼容的JWT令牌 (2小时过期)
    const token = await this.generateTokenPhpCompatible(user.userId, 3600 * 2);

    // 生成refresh token (30天过期)
    const refreshToken = await this.generateTokenPhpCompatible(
      user.userId,
      3600 * 24 * 30,
    );

    return {
      token,
      refreshToken,
    };
  }

  /**
   * 密码认证
   */
  private async authenticateWithPassword(username: string, password: string) {
    if (!username || !password) {
      throw new BadRequestException("用户名和密码不能为空");
    }

    // 行为验证（检查是否需要验证码）
    const requiresCaptcha = await this.captchaService.requiresCaptcha(username);
    if (requiresCaptcha) {
      throw new BadRequestException("登录尝试次数过多，请进行行为验证");
    }

    // 查找用户（支持用户名、邮箱、手机号登录）
    const user = await this.databaseService.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
          this.buildMobileQuery(username)
        ],
      },
    });

    if (!user) {
      // 记录失败登录
      await this.captchaService.trackFailedLogin(username);
      throw new NotFoundException("用户不存在");
    }

    // 验证密码
    const isValidPassword = await this.validatePassword(
      password,
      user.password,
    );
    if (!isValidPassword) {
      // 记录失败登录
      await this.captchaService.trackFailedLogin(username);
      throw new BadRequestException("密码错误");
    }

    return user;
  }

  /**
   * 手机验证码认证
   */
  private async authenticateWithMobile(mobile: string, code: string) {
    if (!mobile || !code) {
      throw new BadRequestException("手机号和验证码不能为空");
    }

    // 查找用户
    const user = await this.databaseService.user.findFirst({
      where: { mobile },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 验证手机验证码（这里需要实现短信验证码验证逻辑）
    const isValidCode = await this.validateMobileCode(mobile, code);
    if (!isValidCode) {
      throw new BadRequestException("手机验证码错误");
    }

    return user;
  }

  /**
   * 邮箱验证码认证
   */
  private async authenticateWithEmail(email: string, code: string) {
    if (!email || !code) {
      throw new BadRequestException("邮箱和验证码不能为空");
    }

    // 查找用户
    const user = await this.databaseService.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 验证邮箱验证码（这里需要实现邮箱验证码验证逻辑）
    const isValidCode = await this.validateEmailCode(email, code);
    if (!isValidCode) {
      throw new BadRequestException("邮箱验证码错误");
    }

    return user;
  }

  /**
   * 构建手机号查询条件（处理区号）
   */
  private buildMobileQuery(mobile: string) {
    // 如果是纯数字且长度11位，可能是手机号
    if (/^\d{11}$/.test(mobile)) {
      return {
        OR: [
          { mobile: mobile }, // 完全匹配（带区号）
          { mobile: { endsWith: mobile } }, // 以手机号结尾（带区号）
          { mobile: { contains: mobile } }, // 包含手机号（更宽松的匹配）
        ]
      };
    }
    return { mobile: mobile }; // 其他情况直接匹配
  }

  /**
   * 验证手机验证码（待实现）
   */
  private async validateMobileCode(
    mobile: string,
    code: string,
  ): Promise<boolean> {
    // 开发环境特殊处理：允许000000验证码通过
    if (process.env.NODE_ENV === "development" && code === "000000") {
      this.logger.debug(
        `开发环境使用测试验证码000000通过验证，手机号：${mobile}`,
      );
      return true;
    }

    // TODO: 实现短信验证码验证逻辑
    // 这里需要连接短信服务，验证验证码是否正确
    return true; // 临时返回true，实际需要验证
  }

  /**
   * 验证邮箱验证码（待实现）
   */
  private async validateEmailCode(
    email: string,
    code: string,
  ): Promise<boolean> {
    // 开发环境特殊处理：允许000000验证码通过
    if (process.env.NODE_ENV === "development" && code === "000000") {
      this.logger.debug(`开发环境使用测试验证码000000通过验证，邮箱：${email}`);
      return true;
    }

    // TODO: 实现邮箱验证码验证逻辑
    // 这里需要连接邮件服务，验证验证码是否正确
    return true; // 临时返回true，实际需要验证
  }

  /**
   * 从Redis验证手机验证码 - 与LoginService保持一致
   */
  private async validateMobileCodeFromRedis(
    mobile: string,
    code: string,
  ): Promise<boolean> {
    try {
      // 开发环境特殊处理：允许000000验证码通过
      if (process.env.NODE_ENV === "development" && code === "000000") {
        this.logger.debug(
          `开发环境使用测试验证码000000通过验证，手机号：${mobile}`,
        );
        return true;
      }

      // 处理国际格式手机号，移除国家代码86
      let normalizedMobile = mobile;
      if (mobile.startsWith("86") && mobile.length > 11) {
        normalizedMobile = mobile.substring(2);
      }

      // 尝试多种可能的Redis key格式
      const possibleKeys = [
        `loginmobileCode:${normalizedMobile}`,
        `registermobileCode:${normalizedMobile}`,
        `mobileCode:${normalizedMobile}`,
      ];

      for (const key of possibleKeys) {
        const storedData = await this.redisService.get(key);
        if (storedData && storedData.code === code) {
          // 验证成功，删除已使用的验证码
          await this.redisService.del(key);
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.debug("验证手机验证码时发生错误:", error);
      return false;
    }
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
      throw new NotFoundException("用户不存在");
    }

    return {
      success: true,
      data: user,
    };
  }

  /**
   * 获取用户权限 - 对齐PHP版本 user/permissions
   */
  async getPermissions(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        email: true,
        role: true,
        emailValidated: true,
        mobileValidated: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 基于角色定义权限
    const rolePermissions = this.getRolePermissions(user.role);

    // 用户特定权限
    const userPermissions = {
      canEditProfile: true,
      canChangePassword: true,
      canManageAddresses: true,
      canViewOrders: true,
      canMakePurchases: user.status === 1,
      canUseEmail: user.emailValidated === 1,
      canUseMobile: user.mobileValidated === 1,
    };

    return {
      status: "success",
      data: {
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        permissions: {
          role: rolePermissions,
          user: userPermissions,
        },
      },
    };
  }

  /**
   * 根据角色获取权限
   */
  private getRolePermissions(role: string): string[] {
    const rolePermissionsMap = {
      admin: [
        "manage_users",
        "manage_products",
        "manage_orders",
        "manage_categories",
        "system_settings",
        "view_analytics",
      ],
      merchant: ["manage_products", "manage_orders", "view_analytics"],
      user: [
        "view_products",
        "make_purchases",
        "view_orders",
        "manage_profile",
      ],
    };

    return rolePermissionsMap[role] || rolePermissionsMap["user"];
  }

  /**
   * 修改密码 - 对齐PHP版本 user/change-password
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 验证当前密码
    const isValidPassword = await this.validatePassword(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      throw new BadRequestException("当前密码错误");
    }

    // 验证新密码确认
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException("新密码确认不匹配");
    }

    // 加密新密码
    const hashedPassword = await this.hashPassword(
      changePasswordDto.newPassword,
    );

    // 更新密码
    await this.databaseService.user.update({
      where: { userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: "密码修改成功",
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
      throw new NotFoundException("邮箱不存在");
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1小时后过期

    // 保存重置令牌到数据库
    await this.databaseService.passwordResetToken.create({
      data: {
        token: resetToken,
        email: forgotPasswordDto.email,
        userId: user.userId,
        expiresAt,
      },
    });

    // TODO: 发送重置密码邮件
    this.logger.debug(
      `Password reset token for ${forgotPasswordDto.email}: ${resetToken}`,
    );

    return {
      status: "success",
      message: "重置密码邮件已发送",
      resetToken,
    };
  }

  /**
   * 重置密码 - 对齐PHP版本 user/reset-password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // 查找重置令牌
    const resetToken = await this.databaseService.passwordResetToken.findUnique(
      {
        where: { token: resetPasswordDto.token },
      },
    );

    if (!resetToken) {
      throw new BadRequestException("重置令牌无效");
    }

    // 检查令牌是否过期
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException("重置令牌已过期");
    }

    // 验证新密码确认
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException("新密码确认不匹配");
    }

    // 加密新密码
    const hashedPassword = await this.hashPassword(
      resetPasswordDto.newPassword,
    );

    // 更新密码
    await this.databaseService.user.update({
      where: { userId: resetToken.userId },
      data: { password: hashedPassword },
    });

    // 删除已使用的重置令牌
    await this.databaseService.passwordResetToken.delete({
      where: { token: resetPasswordDto.token },
    });

    return {
      status: "success",
      message: "密码重置成功",
    };
  }

  /**
   * 用户登出 - 对齐PHP版本 user/logout
   */
  async logout(userId: number, authorization: string) {
    const token = authorization?.replace("Bearer ", "");
    if (token) {
      await this.blacklistToken(token, userId);
    }

    return {
      success: true,
      message: "登出成功",
    };
  }

  /**
   * 刷新令牌 - 对齐PHP版本 user/refresh-token
   */
  async refreshToken(refreshToken: string) {
    const payload = await this.verifyToken(refreshToken);
    if (!payload) {
      throw new BadRequestException("刷新令牌无效");
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
    // 查找验证令牌
    const verificationToken =
      await this.databaseService.emailVerificationToken.findUnique({
        where: { token },
      });

    if (!verificationToken) {
      throw new BadRequestException("验证令牌无效");
    }

    // 检查令牌是否过期
    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException("验证令牌已过期");
    }

    // 更新用户邮箱验证状态
    await this.databaseService.user.update({
      where: { userId: verificationToken.userId },
      data: { emailValidated: 1 },
    });

    // 删除已使用的验证令牌
    await this.databaseService.emailVerificationToken.delete({
      where: { token },
    });

    return {
      status: "success",
      message: "邮箱验证成功",
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
      throw new NotFoundException("用户不存在");
    }

    // 检查是否已验证
    if (user.emailValidated === 1) {
      throw new BadRequestException("邮箱已验证");
    }

    // 生成验证令牌
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000); // 24小时后过期

    // 保存验证令牌
    await this.databaseService.emailVerificationToken.create({
      data: {
        token,
        email: user.email,
        userId: user.userId,
        expiresAt,
      },
    });

    // TODO: 发送验证邮件
    this.logger.debug(`Email verification token for ${user.email}: ${token}`);

    return {
      status: "success",
      message: "验证邮件已发送",
      token,
    };
  }

  /**
   * 检查用户名是否可用 - 对齐PHP版本 user/check-username
   */
  async checkUsername(username: string) {
    if (!username || username.length < 3) {
      throw new BadRequestException("用户名长度至少3个字符");
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
    if (!email || !email.includes("@")) {
      throw new BadRequestException("邮箱格式不正确");
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
      throw new BadRequestException("手机号格式不正确");
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
    // 验证短信验证码
    const isValidCode = await this.verificationCodeService.validateMobileCode(
      mobile,
      code,
    );
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 检查手机号是否已被其他用户使用
    const existingMobile = await this.databaseService.user.findFirst({
      where: { mobile, userId: { not: userId } },
    });

    if (existingMobile) {
      throw new BadRequestException("手机号已被其他用户使用");
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
      status: "success",
      message: "手机号绑定成功",
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
      throw new NotFoundException("用户不存在");
    }

    await this.databaseService.user.update({
      where: { userId },
      data: {
        mobile: "",
        mobileValidated: 0,
      },
    });

    return {
      status: "success",
      message: "手机号解绑成功",
    };
  }

  /**
   * 发送短信验证码 - 对齐PHP版本 user/send-sms-code
   */
  async sendSmsCode(mobile: string, type: string) {
    // 如果是注册验证，检查手机号是否已存在
    if (type === "register") {
      const existingUser = await this.databaseService.user.findFirst({
        where: { mobile },
      });

      if (existingUser) {
        throw new ConflictException("手机号已注册");
      }
    }

    // 生成验证码
    const code = await this.verificationCodeService.generateMobileCode(mobile);

    return {
      status: "success",
      message: "短信验证码已发送",
      code, // 测试用，实际生产环境不返回验证码
    };
  }

  /**
   * 验证短信验证码 - 对齐PHP版本 user/verify-sms-code
   */
  async verifySmsCode(mobile: string, code: string, type: string) {
    // 验证短信验证码
    const isValidCode = await this.verificationCodeService.validateMobileCode(
      mobile,
      code,
    );

    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    // 如果是注册验证，检查用户是否已存在
    if (type === "register") {
      const existingUser = await this.databaseService.user.findFirst({
        where: { mobile },
      });

      if (existingUser) {
        throw new ConflictException("手机号已注册");
      }
    }

    return {
      status: "success",
      message: "验证码验证成功",
    };
  }

  /**
   * 刷新Token
   */
  async refreshToken(refreshToken: string) {
    try {
      // 验证refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: "lyecs@2023",
      });

      // 检查token是否在黑名单中
      const blacklistedToken =
        await this.databaseService.blacklistedToken.findUnique({
          where: { token: refreshToken },
        });

      if (blacklistedToken) {
        throw new UnauthorizedException("Refresh token已失效");
      }

      // 获取用户信息
      const user = await this.databaseService.user.findUnique({
        where: { userId: decoded.data.appId },
      });

      if (!user || user.status !== 1) {
        throw new UnauthorizedException("用户不存在或已被禁用");
      }

      // 生成新的access token (2小时过期)
      const newToken = await this.generateTokenPhpCompatible(
        user.userId,
        3600 * 2,
      );

      // 将旧的refresh token加入黑名单
      await this.databaseService.blacklistedToken.create({
        data: {
          token: refreshToken,
          userId: user.userId,
          expiresAt: new Date(decoded.exp * 1000),
        },
      });

      return {
        token: newToken,
        user: {
          user_id: user.userId,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          nickname: user.nickname,
          avatar: user.avatar,
          status: user.status,
        },
      };
    } catch (error) {
      throw new UnauthorizedException("Refresh token无效或已过期");
    }
  }

  /**
   * 用户登出
   */
  async logout(userId: number, token: string) {
    try {
      // 将当前token加入黑名单
      await this.blacklistToken(token, userId);

      return {
        status: "success",
        message: "登出成功",
      };
    } catch (error) {
      throw new BadRequestException("登出失败");
    }
  }

  /**
   * 获取用户信息
   */
  async getProfile(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        username: true,
        email: true,
        mobile: true,
        nickname: true,
        avatar: true,
        bio: true,
        birthday: true,
        gender: true,
        status: true,
        isEnable: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException("用户不存在");
    }

    return {
      status: "success",
      data: {
        user_id: user.userId,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
        birthday: user.birthday,
        gender: user.gender,
        status: user.status,
        is_enable: user.isEnable,
        last_login: user.lastLogin,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      },
    };
  }

  /**
   * 更新用户信息
   */
  async updateProfile(userId: number, updateData: UpdateProfileDto) {
    // 检查用户是否存在
    const user = await this.databaseService.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      throw new BadRequestException("用户不存在");
    }

    // 准备更新数据
    const updatePayload: any = {};

    if (updateData.nickname !== undefined) {
      // 检查昵称是否已被其他用户使用
      if (updateData.nickname !== user.nickname) {
        const existingNickname = await this.databaseService.user.findFirst({
          where: {
            nickname: updateData.nickname,
            userId: { not: userId },
          },
        });

        if (existingNickname) {
          throw new ConflictException("昵称已被其他用户使用");
        }
      }
      updatePayload.nickname = updateData.nickname;
    }

    if (updateData.email !== undefined) {
      // 检查邮箱是否已被其他用户使用
      if (updateData.email !== user.email) {
        const existingEmail = await this.databaseService.user.findFirst({
          where: {
            email: updateData.email,
            userId: { not: userId },
          },
        });

        if (existingEmail) {
          throw new ConflictException("邮箱已被其他用户使用");
        }
      }
      updatePayload.email = updateData.email;
    }

    if (updateData.mobile !== undefined) {
      // 检查手机号是否已被其他用户使用
      if (updateData.mobile !== user.mobile) {
        const existingMobile = await this.databaseService.user.findFirst({
          where: {
            mobile: updateData.mobile,
            userId: { not: userId },
          },
        });

        if (existingMobile) {
          throw new ConflictException("手机号已被其他用户使用");
        }
      }
      updatePayload.mobile = updateData.mobile;
    }

    if (updateData.avatar !== undefined) {
      updatePayload.avatar = updateData.avatar;
    }

    if (updateData.bio !== undefined) {
      updatePayload.bio = updateData.bio;
    }

    if (updateData.birthday !== undefined) {
      updatePayload.birthday = updateData.birthday;
    }

    // 如果没有要更新的字段
    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException("没有提供要更新的字段");
    }

    // 更新用户信息
    const updatedUser = await this.databaseService.user.update({
      where: { userId: userId },
      data: updatePayload,
    });

    return {
      status: "success",
      message: "用户信息更新成功",
      data: {
        user_id: updatedUser.userId,
        username: updatedUser.username,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        nickname: updatedUser.nickname,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        birthday: updatedUser.birthday,
      },
    };
  }

  /**
   * 修改密码
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    // 检查用户是否存在
    const user = await this.databaseService.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      throw new BadRequestException("用户不存在");
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException("当前密码错误");
    }

    // 验证新密码格式
    if (changePasswordDto.newPassword.length < 6) {
      throw new BadRequestException("新密码长度不能少于6位");
    }

    // 验证确认密码
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException("新密码与确认密码不一致");
    }

    // 检查新密码是否与当前密码相同
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException("新密码不能与当前密码相同");
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      12,
    );

    // 更新密码
    await this.databaseService.user.update({
      where: { userId: userId },
      data: { password: hashedNewPassword },
    });

    return {
      status: "success",
      message: "密码修改成功",
    };
  }
}
