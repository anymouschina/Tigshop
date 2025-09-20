// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { AuthService } from "../../auth/auth.service";
import { VerificationCodeService } from "../../auth/services/verification-code.service";
import { CaptchaService } from "../../auth/services/captcha.service";
import { WechatOAuthService } from "../../auth/services/wechat-oauth.service";
import { SmsService } from "../../auth/services/sms.service";
import { EmailService } from "../../mail/mail.service";
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
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserAuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly captchaService: CaptchaService,
    private readonly wechatOAuthService: WechatOAuthService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 获取快捷登录设置
   */
  async getQuickLoginSetting(): Promise<QuickLoginSettingResponse> {
    const wechatLogin = this.configService.get<string>("openWechatOauth", "0");
    const showOAuth = wechatLogin === "1" ? 1 : 0;

    return {
      wechat_login: parseInt(wechatLogin),
      show_oauth: showOAuth,
    };
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    const { login_type, verify_token, ...credentials } = loginDto;

    // 验证CSRF token
    if (verify_token) {
      await this.captchaService.validateToken(verify_token);
    }

    let user;

    if (login_type === "password") {
      // 密码登录
      if (!credentials.username) {
        throw new BadRequestException("用户名不能为空");
      }

      // 行为验证码
      await this.captchaService.verify(
        `userSignin:${credentials.username}`,
        verify_token,
        3,
      );

      user = await this.loginByPassword(
        credentials.username,
        credentials.password,
      );
    } else if (login_type === "mobile") {
      // 手机登录
      if (!credentials.mobile || !credentials.mobile_code) {
        throw new BadRequestException("手机号和验证码不能为空");
      }

      user = await this.loginByMobile(
        credentials.mobile,
        credentials.mobile_code,
      );
    } else if (login_type === "email") {
      // 邮箱登录
      if (!credentials.email || !credentials.email_code) {
        throw new BadRequestException("邮箱和验证码不能为空");
      }

      user = await this.loginByEmail(credentials.email, credentials.email_code);
    } else {
      throw new BadRequestException("不支持的登录类型");
    }

    if (!user) {
      throw new BadRequestException("账户名或密码错误！");
    }

    if (user.status !== 1) {
      throw new BadRequestException("您的账号已被禁用！");
    }

    await this.setLogin(user.user_id);
    const token = await this.getLoginToken(user.user_id);

    return {
      status: "success",
      data: { token },
    };
  }

  /**
   * 密码登录
   */
  private async loginByPassword(username: string, password: string) {
    const user = await this.databaseService.user.findFirst({
      where: {
        OR: [{ username }, { email: username }, { mobile: username }],
      },
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await this.authService.validatePassword(
      password,
      user.password,
    );
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  /**
   * 手机登录
   */
  private async loginByMobile(mobile: string, code: string) {
    const isValidCode = await this.verificationCodeService.validateMobileCode(
      mobile,
      code,
    );
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    const user = await this.databaseService.user.findUnique({
      where: { mobile },
    });

    return user;
  }

  /**
   * 邮箱登录
   */
  private async loginByEmail(email: string, code: string) {
    const isValidCode = await this.verificationCodeService.validateEmailCode(
      email,
      code,
    );
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    return user;
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto) {
    const { email, password, confirm_password, email_code, ...userData } =
      registerDto;

    // 验证密码
    if (password !== confirm_password) {
      throw new BadRequestException("两次输入的密码不一致");
    }

    // 验证邮箱验证码
    if (email_code) {
      const isValidCode = await this.verificationCodeService.validateEmailCode(
        email,
        email_code,
      );
      if (!isValidCode) {
        throw new BadRequestException("邮箱验证码错误或已过期");
      }
    }

    // 检查邮箱是否已存在
    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("邮箱已被注册");
    }

    // 加密密码
    const hashedPassword = await this.authService.hashPassword(password);

    // 生成用户名
    const username = userData.username || `User_${Date.now()}`;

    // 创建用户
    const user = await this.databaseService.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        emailValidated: 1,
        referrerUserId: userData.referrer_user_id || 0,
      },
    });

    return {
      status: "success",
      message: "注册成功",
      data: { user_id: user.user_id },
    };
  }

  /**
   * 发送手机验证码
   */
  async sendMobileCode(sendMobileCodeDto: SendMobileCodeDto) {
    const { mobile, event, verify_token } = sendMobileCodeDto;

    // 行为验证码
    await this.captchaService.verify(`mobileCode:${mobile}`, verify_token);

    await this.smsService.sendCode(mobile, event);

    return {
      status: "success",
      message: "发送成功！",
    };
  }

  /**
   * 发送邮箱验证码
   */
  async sendEmailCode(sendEmailCodeDto: SendEmailCodeDto) {
    const { email, event, verify_token } = sendEmailCodeDto;

    // 行为验证码
    await this.captchaService.verify(`emailCode:${email}`, verify_token);

    await this.emailService.sendEmailCode(email, event, "register_code");

    return {
      status: "success",
      message: "发送成功！",
    };
  }

  /**
   * 验证手机验证码
   */
  async checkMobileCode(checkMobileCodeDto: CheckMobileCodeDto) {
    const { mobile, code, event } = checkMobileCodeDto;

    const result = await this.verificationCodeService.validateMobileCode(
      mobile,
      code,
    );
    if (!result) {
      throw new BadRequestException("验证码错误或已过期");
    }

    return {
      status: "success",
      message: "验证码验证成功",
    };
  }

  /**
   * 验证邮箱验证码
   */
  async checkEmailCode(checkEmailCodeDto: CheckEmailCodeDto) {
    const { email, code, event } = checkEmailCodeDto;

    const result = await this.verificationCodeService.validateEmailCode(
      email,
      code,
    );
    if (!result) {
      throw new BadRequestException("验证码错误或已过期");
    }

    return {
      status: "success",
      message: "验证码验证成功",
    };
  }

  /**
   * 忘记密码
   */
  async forgetPassword(forgetPasswordDto: ForgetPasswordDto) {
    const { mobile, code, password, confirm_password } = forgetPasswordDto;

    // 验证密码
    if (password !== confirm_password) {
      throw new BadRequestException("两次输入的密码不一致");
    }

    // 验证手机验证码
    const isValidCode = await this.verificationCodeService.validateMobileCode(
      mobile,
      code,
      "forget_password",
    );
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    // 查找用户
    const user = await this.databaseService.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 加密新密码
    const hashedPassword = await this.authService.hashPassword(password);

    // 更新密码
    await this.databaseService.user.update({
      where: { user_id: user.user_id },
      data: { password: hashedPassword },
    });

    return {
      status: "success",
      message: "密码重置成功",
    };
  }

  /**
   * 获取微信登录URL
   */
  async getWechatLoginUrl(wechatLoginUrlDto: WechatLoginUrlDto) {
    const { url } = wechatLoginUrlDto;

    const res = await this.wechatOAuthService.getOAuthUrl(url);

    return {
      status: "success",
      data: {
        url: res.url,
        ticket: res.ticket || "",
      },
    };
  }

  /**
   * 通过微信code登录
   */
  async wechatLoginByCode(wechatLoginByCodeDto: WechatLoginByCodeDto) {
    const { code } = wechatLoginByCodeDto;

    const openData = await this.wechatOAuthService.auth(code);
    if (openData.errcode) {
      throw new BadRequestException(openData.errmsg);
    }

    const openid = openData.openid;
    const unionid = openData.unionid || "";

    // 检查用户是否已经绑定
    const existingAuth = await this.databaseService.userAuthorize.findFirst({
      where: { openId: openid },
    });

    if (existingAuth) {
      await this.setLogin(existingAuth.userId);
      const token = await this.getLoginToken(existingAuth.userId);

      return {
        status: "success",
        data: {
          type: 1,
          token,
        },
      };
    }

    // 检查是否开启微信自动注册
    const openWechatRegister = this.configService.get<string>(
      "openWechatRegister",
      "0",
    );
    if (openWechatRegister === "1") {
      // 自动注册
      const username = `User_${Date.now()}`;
      const password = Math.random().toString(36).substring(2);

      const user = await this.databaseService.user.create({
        data: {
          username,
          password: await this.authService.hashPassword(password),
        },
      });

      await this.databaseService.userAuthorize.create({
        data: {
          userId: user.user_id,
          openId: openid,
          unionId: unionid,
          openInfo: openData,
        },
      });

      await this.setLogin(user.user_id);
      const token = await this.getLoginToken(user.user_id);

      return {
        status: "success",
        data: {
          type: 1,
          token,
        },
      };
    } else {
      return {
        status: "success",
        data: {
          type: 2,
          open_data: openData,
        },
      };
    }
  }

  /**
   * 绑定微信
   */
  async bindWechat(bindWechatDto: BindWechatDto, userId: number) {
    const { code } = bindWechatDto;

    // 检查是否已绑定
    const existingAuth = await this.databaseService.userAuthorize.findFirst({
      where: { userId },
    });

    if (existingAuth) {
      throw new BadRequestException("您已授权，无需重复授权");
    }

    const openData = await this.wechatOAuthService.auth(code);
    if (openData.errcode) {
      throw new BadRequestException(openData.errmsg);
    }

    const openid = openData.openid;

    // 检查是否已绑定其他账号
    const existingUserAuth = await this.databaseService.userAuthorize.findFirst(
      {
        where: { openId: openid },
      },
    );

    if (existingUserAuth && existingUserAuth.userId !== userId) {
      throw new BadRequestException("该微信号已绑定其他账号，请解绑后再重试");
    }

    await this.databaseService.userAuthorize.create({
      data: {
        userId,
        openId: openid,
        openInfo: openData,
      },
    });

    return {
      status: "success",
      message: "绑定成功",
    };
  }

  /**
   * 解绑微信
   */
  async unbindWechat(userId: number) {
    const existingAuth = await this.databaseService.userAuthorize.findFirst({
      where: { userId },
    });

    if (!existingAuth) {
      throw new BadRequestException("该账号未绑定微信公众号");
    }

    await this.databaseService.userAuthorize.delete({
      where: { id: existingAuth.id },
    });

    return {
      status: "success",
      message: "解绑成功",
    };
  }

  /**
   * 绑定手机号
   */
  async bindMobile(bindMobileDto: BindMobileDto) {
    const { mobile, mobile_code, password, open_data, referrer_user_id } =
      bindMobileDto;

    // 验证手机验证码
    const isValidCode = await this.verificationCodeService.validateMobileCode(
      mobile,
      mobile_code,
    );
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    // 检查手机号是否已注册
    const existingUser = await this.databaseService.user.findUnique({
      where: { mobile },
    });

    if (!existingUser) {
      // 注册新用户
      const username = `User_${Date.now()}`;
      const hashedPassword = password
        ? await this.authService.hashPassword(password)
        : null;

      const user = await this.databaseService.user.create({
        data: {
          username,
          password: hashedPassword,
          mobile,
          mobileValidated: 1,
          referrerUserId: referrer_user_id || 0,
        },
      });

      // 绑定微信
      if (open_data?.openid) {
        await this.databaseService.userAuthorize.create({
          data: {
            userId: user.user_id,
            openId: open_data.openid,
            unionId: open_data.unionid,
            openInfo: open_data,
          },
        });
      }

      await this.setLogin(user.user_id);
      const token = await this.getLoginToken(user.user_id);

      return {
        status: "success",
        data: { token },
      };
    } else {
      // 已有用户，直接登录
      await this.setLogin(existingUser.user_id);
      const token = await this.getLoginToken(existingUser.user_id);

      return {
        status: "success",
        data: { token },
      };
    }
  }

  /**
   * 处理微信扫码事件
   */
  async handleWechatEvent(wechatEventDto: WechatEventDto) {
    const { key } = wechatEventDto;

    // 这里需要实现Redis缓存逻辑
    // const openid = await this.redis.get(key);

    // 暂时返回未登录
    return {
      status: "success",
      data: {
        type: 0,
        message: "未登录",
      },
    };
  }

  /**
   * 获取用户手机号（小程序）
   */
  async getUserMobile(getUserMobileDto: GetUserMobileDto) {
    const { code } = getUserMobileDto;

    const res = await this.wechatOAuthService.getMiniUserMobile(code);
    if (res.code !== 0) {
      throw new BadRequestException(res.msg || "授权失败，请稍后再试~");
    }

    // 注册或登录用户
    const existingUser = await this.databaseService.user.findUnique({
      where: { mobile: res.mobile },
    });

    if (!existingUser) {
      const username = `User_${Date.now()}`;
      const user = await this.databaseService.user.create({
        data: {
          username,
          mobile: res.mobile,
          mobileValidated: 1,
        },
      });

      await this.setLogin(user.user_id);
      const token = await this.getLoginToken(user.user_id);

      return {
        status: "success",
        data: { token },
      };
    } else {
      await this.setLogin(existingUser.user_id);
      const token = await this.getLoginToken(existingUser.user_id);

      return {
        status: "success",
        data: { token },
      };
    }
  }

  /**
   * 更新用户openid
   */
  async updateUserOpenId(
    updateUserOpenIdDto: UpdateUserOpenIdDto,
    userId: number,
  ) {
    const { code } = updateUserOpenIdDto;

    const openid = await this.wechatOAuthService.getMiniOpenid(code);
    if (openid) {
      await this.databaseService.userAuthorize.updateMany({
        where: { userId, type: 2 },
        data: { openId: openid },
      });
    }

    return {
      status: "success",
      message: "更新成功",
    };
  }

  /**
   * 获取JSSDK配置
   */
  async getJsSdkConfig(jsSdkConfigDto: JsSdkConfigDto) {
    const { url } = jsSdkConfigDto;

    const params = await this.wechatOAuthService.getJsSdkConfig(url);

    return {
      status: "success",
      data: params,
    };
  }

  /**
   * 设置登录状态
   */
  private async setLogin(userId: number) {
    await this.databaseService.user.update({
      where: { user_id: userId },
      data: {
        lastLogin: new Date(),
        lastIp: "", // 这里可以获取客户端IP
      },
    });
  }

  /**
   * 获取登录token
   */
  private async getLoginToken(userId: number) {
    return this.authService.generateToken({ userId, sub: userId });
  }
}
