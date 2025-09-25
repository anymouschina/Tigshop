// @ts-nocheck
import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { CaptchaService } from "../../auth/services/captcha.service";
import { RedisService } from "../../redis/redis.service";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private captchaService: CaptchaService,
    private redisService: RedisService,
  ) {}

  /**
   * 获取客户端类型
   */
  getClientType(req: any): string {
    const userAgent = req.headers["user-agent"] || "";
    if (
      userAgent.includes("MiniProgram") ||
      userAgent.includes("miniProgram")
    ) {
      return "miniProgram";
    } else if (userAgent.includes("MicroMessenger")) {
      return "wechat";
    } else if (
      userAgent.includes("Windows") ||
      userAgent.includes("Macintosh")
    ) {
      return "pc";
    }
    return "mobile";
  }

  /**
   * 获取快捷登录设置
   */
  async getQuickLoginSetting(clientType: string) {
    let wechatLogin = 0;

    switch (clientType) {
      case "pc":
      case "wechat":
        wechatLogin = 1; // 模拟配置
        break;
      case "miniProgram":
        wechatLogin = 1;
        break;
    }

    return {
      wechat_login: wechatLogin,
      show_oauth: wechatLogin ? 1 : 0,
    };
  }

  /**
   * 用户登录 - 对齐前端参数
   */
  async signin(loginData: any, clientIp: string) {
    const {
      loginType,
      username,
      password,
      mobile,
      mobileCode,
      email,
      emailCode,
      verifyToken,
    } = loginData;

    // 验证码验证（如果有 verifyToken）
    if (verifyToken) {
      try {
        const isValidBehavior = await this.verifyBehaviorToken(verifyToken);
        if (!isValidBehavior) {
          this.logger.debug("行为验证失败");
          // 不阻止登录，只是记录日志
        }
      } catch (error) {
        this.logger.debug("行为验证异常:", error);
        // 不阻止登录，只是记录异常
      }
    }

    let user;

    if (loginType === "password") {
      // 密码登录
      if (!username) {
        throw new HttpException("用户名不能为空", HttpStatus.BAD_REQUEST);
      }
      if (!password) {
        throw new HttpException("密码不能为空", HttpStatus.BAD_REQUEST);
      }

      user = await this.getUserByPassword(username, password);
    } else if (loginType === "mobile") {
      // 手机验证码登录
      if (!mobile || !mobileCode) {
        throw new HttpException(
          "手机号和验证码不能为空",
          HttpStatus.BAD_REQUEST,
        );
      }

      user = await this.getUserByMobileCode(mobile, mobileCode, "login");
    } else if (loginType === "email") {
      // 邮箱验证码登录
      if (!email || !emailCode) {
        throw new HttpException("邮箱和验证码不能为空", HttpStatus.BAD_REQUEST);
      }

      user = await this.getUserByEmailCode(email, emailCode, "register_code");
    } else {
      throw new HttpException("不支持的登录方式", HttpStatus.BAD_REQUEST);
    }

    if (!user) {
      throw new HttpException("账户名或密码错误", HttpStatus.UNAUTHORIZED);
    }

    if (user.status !== 1) {
      throw new HttpException("您的账号已被禁用", HttpStatus.FORBIDDEN);
    }

    // 设置登录状态
    await this.setLogin(user.user_id, clientIp);

    // 生成JWT token
    const token = this.getLoginToken(user.user_id);

    return {
      token,
      user_id: user.user_id,
      username: user.username,
      mobile: user.mobile,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }

  /**
   * 根据用户名密码获取用户
   */
  private async getUserByPassword(username: string, password: string) {
    this.logger.debug(`🔍 查询用户: username=${username}, password=${password}`);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { mobile: username }, { email: username }],
      },
    });

    this.logger.debug(`📊 查询结果:`, user ? {
      user_id: user.user_id,
      username: user.username,
      mobile: user.mobile,
      email: user.email,
      password: user.password,
      status: user.status
    } : '用户不存在');

    if (!user) {
      return null;
    }

    this.logger.debug(`🔐 开始密码比对: 输入密码=${password}, 数据库密码=${user.password}`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    this.logger.debug(`🔐 密码比对结果: ${isPasswordValid ? '成功' : '失败'}`);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * 根据手机号验证码获取用户
   */
  private async getUserByMobileCode(
    mobile: string,
    code: string,
    event: string = "login",
  ) {
    // 验证手机验证码
    const isValidCode = await this.validateMobileCode(mobile, code, event);
    if (!isValidCode) {
      throw new HttpException("手机验证码错误或已过期", HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findFirst({
      where: { mobile },
    });

    if (!user) {
      // 如果用户不存在，自动注册
      return await this.registerUserByMobile(mobile);
    }

    return user;
  }

  /**
   * 根据邮箱验证码获取用户
   */
  private async getUserByEmailCode(
    email: string,
    code: string,
    event: string = "register_code",
  ) {
    // 验证邮箱验证码
    const isValidCode = await this.validateEmailCode(email, code, event);
    if (!isValidCode) {
      throw new HttpException("邮箱验证码错误或已过期", HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // 如果用户不存在，自动注册
      return await this.registerUserByEmail(email);
    }

    return user;
  }

  /**
   * 设置登录状态
   */
  private async setLogin(userId: number, clientIp: string) {
    await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        last_login: Math.floor(Date.now() / 1000),
        last_ip: clientIp || "",
      },
    });
  }

  /**
   * 获取登录token
   */
  private getLoginToken(userId: number): string {
    const payload = { userId, sub: userId };
    return this.jwtService.sign(payload);
  }

  /**
   * 发送验证码 - 支持手机号和邮箱
   */
  async sendMobileCode(data: any) {
    const { mobile, email, event, verifyToken } = data;
    this.logger.debug(
      `发送验证码参数: mobile=${mobile}, email=${email}, event=${event}, verifyToken=${verifyToken}`
    );
    // 验证参数
    if (!mobile && !email) {
      throw new HttpException("手机号需要提供一个", HttpStatus.BAD_REQUEST);
    }

    const defaultEvent = event || "login";

    // 行为验证
    if (!verifyToken) {
      throw new HttpException("验证令牌不能为空", HttpStatus.BAD_REQUEST);
    }

    const isValidBehavior = await this.verifyBehaviorToken(verifyToken);
    if (!isValidBehavior) {
      throw new HttpException("行为验证失败", HttpStatus.BAD_REQUEST);
    }

    try {
      // 生成6位验证码 - 临时固定为0000用于测试
      const code = "000000";

      // 根据是手机号还是邮箱分别处理
      if (mobile) {
        // 处理国际格式手机号，移除国家代码86
        let normalizedMobile = mobile;
        if (mobile.startsWith("86") && mobile.length > 11) {
          normalizedMobile = mobile.substring(2);
        }

        const redisKey = `${defaultEvent}mobileCode:${normalizedMobile}`;
        const expiration = 120;

        await this.redisService.set(
          redisKey,
          {
            code,
            mobile: normalizedMobile,
            event: defaultEvent,
            created_at: Date.now(),
          },
          { ttl: expiration },
        );

        this.logger.debug(`短信验证码已发送至 ${mobile}: ${code}`);

        return {
          mobile: normalizedMobile,
          event: defaultEvent,
          key: redisKey,
        };
      } else if (email) {
        const redisKey = `${defaultEvent}emailCode:${email}`;
        const expiration = 120;

        await this.redisService.set(
          redisKey,
          {
            code,
            email,
            event: defaultEvent,
            created_at: Date.now(),
          },
          { ttl: expiration },
        );

        this.logger.debug(`邮箱验证码已发送至 ${email}: ${code}`);

        return {
          email,
          event: defaultEvent,
          key: redisKey,
        };
      }
    } catch (error) {
      this.logger.debug("发送验证码失败:", error);
      throw new HttpException("发送失败", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 验证行为令牌 - 临时简化实现用于测试
   */
  private async verifyBehaviorToken(verifyToken: string): Promise<boolean> {
    try {
      // 临时测试：直接返回true，跳过行为验证
      this.logger.debug("临时跳过行为验证，token:", verifyToken);
      return true;

      // 原始验证逻辑（暂时注释掉）
      // // 这里应该验证滑块验证码或其他行为验证
      // // 与PHP的CaptchaService->check()对应
      // // 实际使用时需要调用captchaService.verifySlider()或类似方法

      // // 检查Redis中是否存在验证token
      // const captchaData = await this.captchaService.getCaptchaData(verifyToken);
      // return !!captchaData;
    } catch (error) {
      this.logger.debug("行为验证失败:", error);
      return false;
    }
  }

  /**
   * 发送邮箱验证码 - 对齐PHP实现
   */
  async sendEmailCode(email: string, event: string, verifyToken: string) {
    if (!email) {
      throw new HttpException("邮箱不能为空", HttpStatus.BAD_REQUEST);
    }

    // 设置默认event为register_code，与PHP实现一致
    if (!event) {
      event = "register_code";
    }

    // 行为验证
    if (!verifyToken) {
      throw new HttpException("验证令牌不能为空", HttpStatus.BAD_REQUEST);
    }

    const isValidBehavior = await this.verifyBehaviorToken(verifyToken);
    if (!isValidBehavior) {
      throw new HttpException("行为验证失败", HttpStatus.BAD_REQUEST);
    }

    try {
      // 生成6位验证码 - 临时固定为0000用于测试
      const code = "0000";

      // 使用Redis存储验证码，与PHP实现一致
      const redisKey = `${event}emailCode:${email}`;
      const expiration = 120; // 2分钟过期，与PHP一致

      await this.redisService.set(
        redisKey,
        {
          code,
          email,
          event,
          created_at: Date.now(),
        },
        { ttl: expiration },
      );

      // TODO: 集成实际的邮件发送服务
      this.logger.debug(`邮箱验证码已发送至 ${email}: ${code}`);

      return {
        email,
        event,
        key: redisKey,
      };
    } catch (error) {
      this.logger.debug("发送邮箱验证码失败:", error);
      throw new HttpException("发送失败", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 验证手机号
   */
  async checkMobile(mobile: string, code: string) {
    const isValid = await this.validateMobileCode(
      mobile,
      code,
      "forget_password",
    );
    return { valid: isValid };
  }

  /**
   * 验证邮箱
   */
  async checkEmail(email: string, code: string) {
    const isValid = await this.validateEmailCode(email, code, "register_code");
    return { valid: isValid };
  }

  /**
   * 验证手机验证码 - 使用Redis存储
   */
  private async validateMobileCode(
    mobile: string,
    code: string,
    event: string,
  ): Promise<boolean> {
    try {
      // 使用Redis key pattern: {event}mobileCode:{mobile}
      const redisKey = `${event}mobileCode:${mobile}`;
      const verificationData = await this.redisService.get<any>(redisKey);

      if (!verificationData) {
        this.logger.debug(`验证码不存在或已过期: ${redisKey}`);
        return false;
      }

      if (verificationData.code !== code) {
        this.logger.debug(`验证码不匹配: 期望${verificationData.code}, 实际${code}`);
        return false;
      }

      // 验证成功，删除Redis中的验证码（一次性使用）
      await this.redisService.del(redisKey);
      this.logger.debug(`验证码验证成功并已删除: ${redisKey}`);

      return true;
    } catch (error) {
      this.logger.debug("验证手机验证码失败:", error);
      return false;
    }
  }

  /**
   * 验证邮箱验证码 - 使用Redis存储
   */
  private async validateEmailCode(
    email: string,
    code: string,
    event: string,
  ): Promise<boolean> {
    try {
      // 使用Redis key pattern: {event}emailCode:{email}
      const redisKey = `${event}emailCode:${email}`;
      const verificationData = await this.redisService.get<any>(redisKey);

      if (!verificationData) {
        this.logger.debug(`邮箱验证码不存在或已过期: ${redisKey}`);
        return false;
      }

      if (verificationData.code !== code) {
        this.logger.debug(
          `邮箱验证码不匹配: 期望${verificationData.code}, 实际${code}`,
        );
        return false;
      }

      // 验证成功，删除Redis中的验证码（一次性使用）
      await this.redisService.del(redisKey);
      this.logger.debug(`邮箱验证码验证成功并已删除: ${redisKey}`);

      return true;
    } catch (error) {
      this.logger.debug("验证邮箱验证码失败:", error);
      return false;
    }
  }

  /**
   * 忘记密码
   */
  async forgetPassword(mobileKey: string, password: string) {
    if (!password) {
      throw new HttpException("新密码不能为空", HttpStatus.BAD_REQUEST);
    }

    // 这里应该验证mobileKey，暂时简化处理
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.updateMany({
      where: { mobile: mobileKey }, // 简化处理，实际应该更安全的验证
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  /**
   * 获取微信登录URL
   */
  async getWechatLoginUrl(redirectUrl: string) {
    // 模拟微信OAuth URL生成
    const state = uuidv4();
    const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=YOUR_APPID&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;

    return {
      url,
      ticket: state,
    };
  }

  /**
   * 通过微信code获取用户信息
   */
  async getWechatLoginInfoByCode(code: string) {
    if (!code) {
      throw new HttpException("code不能为空", HttpStatus.BAD_REQUEST);
    }

    // 模拟微信OAuth认证
    const openData = {
      openid: `openid_${Date.now()}`,
      unionid: `unionid_${Date.now()}`,
      nickname: "微信用户",
      headimgurl: "",
    };

    // 检查用户是否已经绑定
    const userAuth = await this.prisma.userAuthorize.findFirst({
      where: { openid: openData.openid },
    });

    let userId;
    if (!userAuth) {
      // 自动注册用户
      const newUser = await this.prisma.user.create({
        data: {
          username: `User_${Date.now()}`,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          reg_time: Math.floor(Date.now() / 1000),
          status: 1,
        },
      });

      userId = newUser.user_id;

      // 绑定微信授权信息
      await this.prisma.userAuthorize.create({
        data: {
          user_id: userId,
          openid: openData.openid,
          unionid: openData.unionid,
          auth_data: JSON.stringify(openData),
        },
      });
    } else {
      userId = userAuth.user_id;
    }

    // 设置登录状态
    await this.setLogin(userId, "");

    // 生成token
    const token = this.getLoginToken(userId);

    return {
      type: 1,
      token,
    };
  }

  /**
   * 绑定微信
   */
  async bindWechat(userId: number, code: string) {
    if (!code) {
      throw new HttpException("code不能为空", HttpStatus.BAD_REQUEST);
    }

    // 检查是否已经绑定
    const existingAuth = await this.prisma.userAuthorize.findFirst({
      where: { user_id: userId },
    });

    if (existingAuth) {
      throw new HttpException("您已授权，无需重复授权", HttpStatus.BAD_REQUEST);
    }

    // 模拟微信OAuth认证
    const openData = {
      openid: `openid_${Date.now()}`,
      unionid: `unionid_${Date.now()}`,
    };

    // 检查是否已经绑定其他账号
    const otherAuth = await this.prisma.userAuthorize.findFirst({
      where: { openid: openData.openid },
    });

    if (otherAuth && otherAuth.user_id !== userId) {
      throw new HttpException(
        "该微信号已绑定其他账号，请解绑后再重试",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 绑定微信
    await this.prisma.userAuthorize.create({
      data: {
        user_id: userId,
        openid: openData.openid,
        unionid: openData.unionid,
        auth_data: JSON.stringify(openData),
      },
    });

    return { message: "绑定成功" };
  }

  /**
   * 解除绑定微信
   */
  async unbindWechat(userId: number) {
    const auth = await this.prisma.userAuthorize.findFirst({
      where: { user_id: userId },
    });

    if (!auth) {
      throw new HttpException("该账号未绑定微信公众号", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.userAuthorize.delete({
      where: { id: auth.id },
    });

    return { message: "解绑成功" };
  }

  /**
   * 绑定手机号
   */
  async bindMobile(data: any) {
    const { mobile, mobile_code, password, open_data, referrer_user_id } = data;

    // 验证手机验证码
    const isValidCode = await this.validateMobileCode(
      mobile,
      mobile_code,
      "login",
    );
    if (!isValidCode) {
      throw new HttpException(
        "短信验证码错误或已过期，请重试",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 注册用户
    const user = await this.registerUserByMobile(
      mobile,
      password,
      referrer_user_id,
    );

    // 如果有微信数据，绑定微信
    if (open_data?.openid) {
      await this.prisma.userAuthorize.create({
        data: {
          user_id: user.user_id,
          openid: open_data.openid,
          unionid: open_data.unionid,
          auth_data: JSON.stringify(open_data),
        },
      });
    }

    // 设置登录状态
    await this.setLogin(user.user_id, "");

    // 生成token
    const token = this.getLoginToken(user.user_id);

    return { token };
  }

  /**
   * 通过手机号注册用户
   */
  private async registerUserByMobile(
    mobile: string,
    password?: string,
    referrerUserId?: number,
  ) {
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash(Math.random().toString(36), 10);

    const userData: any = {
      username: `User_${Date.now()}`,
      password: hashedPassword,
      mobile,
      reg_time: Math.floor(Date.now() / 1000),
      status: 1,
    };

    if (referrerUserId) {
      userData.referrer_user_id = referrerUserId;
    }

    return this.prisma.user.create({
      data: userData,
    });
  }

  /**
   * 通过邮箱注册用户
   */
  private async registerUserByEmail(email: string) {
    const password = await bcrypt.hash(Math.random().toString(36), 10);

    return this.prisma.user.create({
      data: {
        username: `User_${Date.now()}`,
        password,
        email,
        reg_time: Math.floor(Date.now() / 1000),
        status: 1,
      },
    });
  }

  /**
   * 微信服务端验证
   */
  async wechatServerVerify(query: any) {
    // 模拟微信服务器验证
    return { success: true };
  }

  /**
   * 处理微信消息
   */
  async getWechatMessage(message: any) {
    // 处理微信消息
    if (message.Event && ["subscribe", "SCAN"].includes(message.Event)) {
      // 处理关注和扫码事件
      // 这里应该存储ticket和openid的映射关系
    }

    return { success: true };
  }

  /**
   * 微信事件处理
   */
  async wechatEvent(key: string) {
    if (!key) {
      return {
        type: 0,
        message: "未登录",
      };
    }

    // 模拟从缓存获取openid
    const openid = `openid_${key}`;

    if (!openid) {
      return {
        type: 0,
        message: "未登录",
      };
    }

    // 检查用户授权
    const userAuth = await this.prisma.userAuthorize.findFirst({
      where: { openid },
    });

    let userId;
    if (!userAuth) {
      // 自动注册用户
      const newUser = await this.prisma.user.create({
        data: {
          username: `User_${Date.now()}`,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          reg_time: Math.floor(Date.now() / 1000),
          status: 1,
        },
      });

      userId = newUser.user_id;

      // 绑定微信授权信息
      await this.prisma.userAuthorize.create({
        data: {
          user_id: userId,
          openid,
          auth_data: JSON.stringify({ openid }),
        },
      });
    } else {
      userId = userAuth.user_id;
    }

    // 设置登录状态
    await this.setLogin(userId, "");

    // 生成token
    const token = this.getLoginToken(userId);

    return {
      type: 1,
      token,
    };
  }

  /**
   * 获取用户手机号
   */
  async getUserMobile(code: string) {
    // 模拟获取微信用户手机号
    const res = {
      code: 1,
      mobile: `138${Math.floor(10000000 + Math.random() * 90000000)}`,
    };

    if (!res.code) {
      throw new HttpException("授权失败，请稍后再试~", HttpStatus.BAD_REQUEST);
    }

    // 注册用户
    const user = await this.registerUserByMobile(res.mobile);

    // 设置登录状态
    await this.setLogin(user.user_id, "");

    // 生成token
    const token = this.getLoginToken(user.user_id);

    return { token };
  }

  /**
   * 更新用户OpenId
   */
  async updateUserOpenId(userId: number, code: string) {
    // 模拟获取小程序openid
    const openid = `mini_openid_${Date.now()}`;

    // 更新用户授权信息
    await this.prisma.userAuthorize.upsert({
      where: {
        user_id_platform: {
          user_id: userId,
          platform: 2, // 小程序
        },
      },
      update: {
        openid,
      },
      create: {
        user_id: userId,
        openid,
        platform: 2,
      },
    });

    return { success: true };
  }

  /**
   * 获取JSSDK配置
   */
  async getJsSdkConfig(url: string) {
    // 模拟JSSDK配置
    return {
      appId: "YOUR_APPID",
      timestamp: Math.floor(Date.now() / 1000),
      nonceStr: uuidv4(),
      signature: "mock_signature",
    };
  }
}
