// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoginService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 获取客户端类型
   */
  getClientType(req: any): string {
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('MiniProgram') || userAgent.includes('miniProgram')) {
      return 'miniProgram';
    } else if (userAgent.includes('MicroMessenger')) {
      return 'wechat';
    } else if (userAgent.includes('Windows') || userAgent.includes('Macintosh')) {
      return 'pc';
    }
    return 'mobile';
  }

  /**
   * 获取快捷登录设置
   */
  async getQuickLoginSetting(clientType: string) {
    let wechatLogin = 0;

    switch (clientType) {
      case 'pc':
      case 'wechat':
        wechatLogin = 1; // 模拟配置
        break;
      case 'miniProgram':
        wechatLogin = 1;
        break;
    }

    return {
      wechat_login: wechatLogin,
      show_oauth: wechatLogin ? 1 : 0,
    };
  }

  /**
   * 用户登录
   */
  async signin(loginData: any, clientIp: string) {
    const { login_type, username, password, mobile, mobile_code, email, email_code } = loginData;

    // CSRF验证
    if (loginData.csrfToken) {
      // 这里应该验证CSRF token
      // 暂时跳过
    }

    let user;

    if (login_type === 'password') {
      // 密码登录
      if (!username) {
        throw new HttpException('用户名不能为空', HttpStatus.BAD_REQUEST);
      }

      // 验证码验证（简化版）
      if (loginData.verify_token) {
        // 这里应该验证行为验证码
        // 暂时跳过
      }

      user = await this.getUserByPassword(username, password);
    } else if (login_type === 'mobile') {
      // 手机登录
      if (!mobile || !mobile_code) {
        throw new HttpException('手机号和验证码不能为空', HttpStatus.BAD_REQUEST);
      }

      user = await this.getUserByMobileCode(mobile, mobile_code);
    } else if (login_type === 'email') {
      // 邮箱登录
      if (!email || !email_code) {
        throw new HttpException('邮箱和验证码不能为空', HttpStatus.BAD_REQUEST);
      }

      user = await this.getUserByEmailCode(email, email_code);
    } else {
      throw new HttpException('不支持的登录方式', HttpStatus.BAD_REQUEST);
    }

    if (!user) {
      throw new HttpException('账户名或密码错误', HttpStatus.UNAUTHORIZED);
    }

    if (user.status !== 1) {
      throw new HttpException('您的账号已被禁用', HttpStatus.FORBIDDEN);
    }

    // 设置登录状态
    await this.setLogin(user.user_id, clientIp);

    // 生成JWT token
    const token = this.getLoginToken(user.user_id);

    return {
      token,
      user_id: user.user_id,
      username: user.username,
    };
  }

  /**
   * 根据用户名密码获取用户
   */
  private async getUserByPassword(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { mobile: username },
          { email: username },
        ],
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * 根据手机号验证码获取用户
   */
  private async getUserByMobileCode(mobile: string, code: string) {
    // 验证手机验证码
    const isValidCode = await this.validateMobileCode(mobile, code, 'login');
    if (!isValidCode) {
      throw new HttpException('手机验证码错误或已过期', HttpStatus.BAD_REQUEST);
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
  private async getUserByEmailCode(email: string, code: string) {
    // 验证邮箱验证码
    const isValidCode = await this.validateEmailCode(email, code, 'register_code');
    if (!isValidCode) {
      throw new HttpException('邮箱验证码错误或已过期', HttpStatus.BAD_REQUEST);
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
        last_ip: clientIp || '',
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
   * 发送手机验证码
   */
  async sendMobileCode(mobile: string, event: string) {
    if (!mobile) {
      throw new HttpException('手机号不能为空', HttpStatus.BAD_REQUEST);
    }

    // 验证码验证（简化版）
    // 这里应该验证行为验证码
    // 暂时跳过

    try {
      // 模拟发送验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 存储验证码（实际应该使用Redis）
      await this.prisma.verificationCode.create({
        data: {
          target: mobile,
          code,
          type: 'mobile',
          event,
          expired_at: new Date(Date.now() + 5 * 60 * 1000), // 5分钟过期
        },
      });

      return { message: '发送成功' };
    } catch (error) {
      throw new HttpException('发送失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 发送邮箱验证码
   */
  async sendEmailCode(email: string, event: string) {
    if (!email) {
      throw new HttpException('邮箱不能为空', HttpStatus.BAD_REQUEST);
    }

    // 验证码验证（简化版）
    // 这里应该验证行为验证码
    // 暂时跳过

    try {
      // 模拟发送验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 存储验证码（实际应该使用Redis）
      await this.prisma.verificationCode.create({
        data: {
          target: email,
          code,
          type: 'email',
          event,
          expired_at: new Date(Date.now() + 5 * 60 * 1000), // 5分钟过期
        },
      });

      return { message: '发送成功' };
    } catch (error) {
      throw new HttpException('发送失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 验证手机号
   */
  async checkMobile(mobile: string, code: string) {
    const isValid = await this.validateMobileCode(mobile, code, 'forget_password');
    return { valid: isValid };
  }

  /**
   * 验证邮箱
   */
  async checkEmail(email: string, code: string) {
    const isValid = await this.validateEmailCode(email, code, 'register_code');
    return { valid: isValid };
  }

  /**
   * 验证手机验证码
   */
  private async validateMobileCode(mobile: string, code: string, event: string): Promise<boolean> {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        target: mobile,
        code,
        type: 'mobile',
        event,
        expired_at: { gt: new Date() },
        used: false,
      },
    });

    if (verification) {
      // 标记为已使用
      await this.prisma.verificationCode.update({
        where: { id: verification.id },
        data: { used: true },
      });
      return true;
    }

    return false;
  }

  /**
   * 验证邮箱验证码
   */
  private async validateEmailCode(email: string, code: string, event: string): Promise<boolean> {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        target: email,
        code,
        type: 'email',
        event,
        expired_at: { gt: new Date() },
        used: false,
      },
    });

    if (verification) {
      // 标记为已使用
      await this.prisma.verificationCode.update({
        where: { id: verification.id },
        data: { used: true },
      });
      return true;
    }

    return false;
  }

  /**
   * 忘记密码
   */
  async forgetPassword(mobileKey: string, password: string) {
    if (!password) {
      throw new HttpException('新密码不能为空', HttpStatus.BAD_REQUEST);
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
      throw new HttpException('code不能为空', HttpStatus.BAD_REQUEST);
    }

    // 模拟微信OAuth认证
    const openData = {
      openid: `openid_${Date.now()}`,
      unionid: `unionid_${Date.now()}`,
      nickname: '微信用户',
      headimgurl: '',
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
    await this.setLogin(userId, '');

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
      throw new HttpException('code不能为空', HttpStatus.BAD_REQUEST);
    }

    // 检查是否已经绑定
    const existingAuth = await this.prisma.userAuthorize.findFirst({
      where: { user_id: userId },
    });

    if (existingAuth) {
      throw new HttpException('您已授权，无需重复授权', HttpStatus.BAD_REQUEST);
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
      throw new HttpException('该微信号已绑定其他账号，请解绑后再重试', HttpStatus.BAD_REQUEST);
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

    return { message: '绑定成功' };
  }

  /**
   * 解除绑定微信
   */
  async unbindWechat(userId: number) {
    const auth = await this.prisma.userAuthorize.findFirst({
      where: { user_id: userId },
    });

    if (!auth) {
      throw new HttpException('该账号未绑定微信公众号', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.userAuthorize.delete({
      where: { id: auth.id },
    });

    return { message: '解绑成功' };
  }

  /**
   * 绑定手机号
   */
  async bindMobile(data: any) {
    const { mobile, mobile_code, password, open_data, referrer_user_id } = data;

    // 验证手机验证码
    const isValidCode = await this.validateMobileCode(mobile, mobile_code, 'login');
    if (!isValidCode) {
      throw new HttpException('短信验证码错误或已过期，请重试', HttpStatus.BAD_REQUEST);
    }

    // 注册用户
    const user = await this.registerUserByMobile(mobile, password, referrer_user_id);

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
    await this.setLogin(user.user_id, '');

    // 生成token
    const token = this.getLoginToken(user.user_id);

    return { token };
  }

  /**
   * 通过手机号注册用户
   */
  private async registerUserByMobile(mobile: string, password?: string, referrerUserId?: number) {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash(Math.random().toString(36), 10);

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
    if (message.Event && ['subscribe', 'SCAN'].includes(message.Event)) {
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
        message: '未登录',
      };
    }

    // 模拟从缓存获取openid
    const openid = `openid_${key}`;

    if (!openid) {
      return {
        type: 0,
        message: '未登录',
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
    await this.setLogin(userId, '');

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
      throw new HttpException('授权失败，请稍后再试~', HttpStatus.BAD_REQUEST);
    }

    // 注册用户
    const user = await this.registerUserByMobile(res.mobile);

    // 设置登录状态
    await this.setLogin(user.user_id, '');

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
      appId: 'YOUR_APPID',
      timestamp: Math.floor(Date.now() / 1000),
      nonceStr: uuidv4(),
      signature: 'mock_signature',
    };
  }
}
