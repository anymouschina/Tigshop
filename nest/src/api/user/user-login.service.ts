// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
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
} from "./dto/user-login.dto";

@Injectable()
export class UserLoginService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getQuickLoginSetting() {
    // 获取快捷登录设置
    const settings = {
      wechat_login: 1,
      mobile_login: 1,
      email_login: 1,
      register_type: ["mobile", "email"],
      captcha_enabled: 1,
    };

    return {
      code: 200,
      message: "获取成功",
      data: settings,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password, login_type = "username", code } = loginDto;

    let user;

    switch (login_type) {
      case "username":
        user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { username: username },
              { mobile: username },
              { email: username },
            ],
            is_delete: 0,
          },
        });
        break;

      case "mobile":
        // 手机验证码登录
        if (!code) {
          throw new BadRequestException("请输入验证码");
        }
        user = await this.prisma.user.findFirst({
          where: {
            mobile: username,
            is_delete: 0,
          },
        });
        break;

      case "email":
        // 邮箱验证码登录
        if (!code) {
          throw new BadRequestException("请输入验证码");
        }
        user = await this.prisma.user.findFirst({
          where: {
            email: username,
            is_delete: 0,
          },
        });
        break;

      default:
        throw new BadRequestException("不支持的登录方式");
    }

    if (!user) {
      throw new UnauthorizedException("用户不存在或已被禁用");
    }

    // 密码验证
    if (login_type === "username") {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException("密码错误");
      }
    } else {
      // 验证码验证（这里需要实现验证码验证逻辑）
      const isValidCode = await this.verifyCode(username, code, login_type);
      if (!isValidCode) {
        throw new UnauthorizedException("验证码错误或已过期");
      }
    }

    // 检查用户状态
    if (user.status !== 1) {
      throw new UnauthorizedException("用户账号已被禁用");
    }

    // 生成JWT token
    const payload = { userId: user.user_id, username: user.username };
    const token = this.jwtService.sign(payload);

    // 更新登录信息
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        last_login_time: Math.floor(Date.now() / 1000),
        last_login_ip: "", // 可以从request中获取
      },
    });

    // 移除敏感信息
    const { password: _, ...userWithoutPassword } = user;

    return {
      code: 200,
      message: "登录成功",
      data: {
        token,
        user: userWithoutPassword,
      },
    };
  }

  async sendMobileCode(mobile: string, type: string) {
    // 验证手机号格式
    if (!this.validateMobile(mobile)) {
      throw new BadRequestException("手机号格式不正确");
    }

    // 检查发送频率限制
    await this.checkSendLimit(mobile, type);

    // 生成验证码
    const code = this.generateCode(6);

    // 发送短信验证码（这里需要集成短信服务）
    await this.sendSmsCode(mobile, code);

    // 保存验证码到缓存（这里需要集成缓存服务）
    await this.saveCodeToCache(mobile, code, type);

    return {
      code: 200,
      message: "验证码发送成功",
      data: null,
    };
  }

  async checkMobile(mobile: string) {
    if (!this.validateMobile(mobile)) {
      throw new BadRequestException("手机号格式不正确");
    }

    const user = await this.prisma.user.findFirst({
      where: { mobile, is_delete: 0 },
    });

    return {
      code: 200,
      message: "检查成功",
      data: {
        exists: !!user,
      },
    };
  }

  async checkEmail(email: string) {
    if (!this.validateEmail(email)) {
      throw new BadRequestException("邮箱格式不正确");
    }

    const user = await this.prisma.user.findFirst({
      where: { email, is_delete: 0 },
    });

    return {
      code: 200,
      message: "检查成功",
      data: {
        exists: !!user,
      },
    };
  }

  async forgetPassword(body: ForgetPasswordDto) {
    const { mobile, code, new_password, confirm_password } = body;

    if (new_password !== confirm_password) {
      throw new BadRequestException("两次密码输入不一致");
    }

    // 验证手机号和验证码
    const isValidCode = await this.verifyCode(mobile, code, "forget_password");
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    const user = await this.prisma.user.findFirst({
      where: { mobile, is_delete: 0 },
    });

    if (!user) {
      throw new BadRequestException("用户不存在");
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // 更新密码
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { password: hashedPassword },
    });

    return {
      code: 200,
      message: "密码重置成功",
      data: null,
    };
  }

  async getWechatLoginUrl(redirectUrl?: string) {
    // 生成微信登录URL
    const appId = process.env.WECHAT_APP_ID;
    const redirectUri = encodeURIComponent(
      redirectUrl || process.env.WECHAT_REDIRECT_URI,
    );
    const state = Math.random().toString(36).substr(2);
    const scope = "snsapi_login";

    const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;

    return {
      code: 200,
      message: "获取成功",
      data: {
        url,
        state,
      },
    };
  }

  async getWechatLoginInfoByCode(code: string, state?: string) {
    // 通过code获取微信用户信息
    const accessToken = await this.getWechatAccessToken(code);
    const userInfo = await this.getWechatUserInfo(accessToken);

    // 检查是否已绑定用户
    const user = await this.prisma.user.findFirst({
      where: { wechat_openid: userInfo.openid, is_delete: 0 },
    });

    if (!user) {
      // 未绑定用户，返回微信信息供前端处理
      return {
        code: 200,
        message: "获取成功",
        data: {
          need_bind: true,
          wechat_info: userInfo,
        },
      };
    }

    // 生成JWT token
    const payload = { userId: user.user_id, username: user.username };
    const token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user;

    return {
      code: 200,
      message: "登录成功",
      data: {
        token,
        user: userWithoutPassword,
      },
    };
  }

  async bindMobile(body: BindMobileDto) {
    const { wechat_info, mobile, code } = body;

    // 验证手机验证码
    const isValidCode = await this.verifyCode(mobile, code, "bind_mobile");
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    // 检查手机号是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: { mobile, is_delete: 0 },
    });

    if (existingUser) {
      // 已存在用户，绑定微信
      await this.prisma.user.update({
        where: { user_id: existingUser.user_id },
        data: {
          wechat_openid: wechat_info.openid,
          wechat_nickname: wechat_info.nickname,
          wechat_headimgurl: wechat_info.headimgurl,
        },
      });

      // 生成JWT token
      const payload = {
        userId: existingUser.user_id,
        username: existingUser.username,
      };
      const token = this.jwtService.sign(payload);

      const { password: _, ...userWithoutPassword } = existingUser;

      return {
        code: 200,
        message: "绑定成功",
        data: {
          token,
          user: userWithoutPassword,
        },
      };
    } else {
      // 创建新用户
      const newUser = await this.prisma.user.create({
        data: {
          username: wechat_info.openid,
          mobile,
          wechat_openid: wechat_info.openid,
          wechat_nickname: wechat_info.nickname,
          wechat_headimgurl: wechat_info.headimgurl,
          password: "", // 微信用户初始密码为空
          add_time: Math.floor(Date.now() / 1000),
          status: 1,
        },
      });

      // 生成JWT token
      const payload = { userId: newUser.user_id, username: newUser.username };
      const token = this.jwtService.sign(payload);

      const { password: _, ...userWithoutPassword } = newUser;

      return {
        code: 200,
        message: "注册并绑定成功",
        data: {
          token,
          user: userWithoutPassword,
        },
      };
    }
  }

  async bindWechat(userId: number, body: BindWechatDto) {
    const { code } = body;

    // 通过code获取微信用户信息
    const accessToken = await this.getWechatAccessToken(code);
    const userInfo = await this.getWechatUserInfo(accessToken);

    // 检查微信是否已被其他用户绑定
    const existingUser = await this.prisma.user.findFirst({
      where: {
        wechat_openid: userInfo.openid,
        user_id: { not: userId },
        is_delete: 0,
      },
    });

    if (existingUser) {
      throw new BadRequestException("该微信账号已被其他用户绑定");
    }

    // 绑定微信
    await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        wechat_openid: userInfo.openid,
        wechat_nickname: userInfo.nickname,
        wechat_headimgurl: userInfo.headimgurl,
      },
    });

    return {
      code: 200,
      message: "绑定成功",
      data: null,
    };
  }

  async unbindWechat(userId: number) {
    await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        wechat_openid: null,
        wechat_nickname: null,
        wechat_headimgurl: null,
      },
    });

    return {
      code: 200,
      message: "解绑成功",
      data: null,
    };
  }

  async wechatServerVerify(query: any) {
    // 微信服务器校验
    const { signature, timestamp, nonce, echostr } = query;
    const token = process.env.WECHAT_TOKEN;

    // 这里实现微信服务器校验逻辑
    // 需要对signature进行验证

    return echostr;
  }

  async getWechatMessage(body: any) {
    // 处理微信推送消息
    console.log("收到微信消息:", body);

    return "success";
  }

  async wechatEvent(body: any) {
    // 处理微信用户操作事件
    console.log("收到微信事件:", body);

    return "success";
  }

  async getUserMobile(body: any) {
    // 获取手机号（微信小程序）
    console.log("获取手机号:", body);

    return {
      code: 200,
      message: "获取成功",
      data: {
        mobile: "13800138000", // 示例数据
      },
    };
  }

  async updateUserOpenId(userId: number, openId: string) {
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { wechat_openid: openId },
    });

    return {
      code: 200,
      message: "更新成功",
      data: null,
    };
  }

  async getJsSdkConfig(userId: number, url: string) {
    // 获取JSSDK配置
    const config = {
      appId: process.env.WECHAT_APP_ID,
      timestamp: Math.floor(Date.now() / 1000),
      nonceStr: Math.random().toString(36).substr(2),
      signature: "", // 需要生成签名
      url: url,
    };

    return {
      code: 200,
      message: "获取成功",
      data: config,
    };
  }

  async sendEmailCode(email: string, type: string) {
    if (!this.validateEmail(email)) {
      throw new BadRequestException("邮箱格式不正确");
    }

    // 检查发送频率限制
    await this.checkSendLimit(email, type);

    // 生成验证码
    const code = this.generateCode(6);

    // 发送邮件验证码（这里需要集成邮件服务）
    await this.sendEmailCodeToUser(email, code);

    // 保存验证码到缓存
    await this.saveCodeToCache(email, code, type);

    return {
      code: 200,
      message: "验证码发送成功",
      data: null,
    };
  }

  // 私有方法
  private validateMobile(mobile: string): boolean {
    return /^1[3-9]\d{9}$/.test(mobile);
  }

  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private generateCode(length: number): string {
    return Math.random().toString().substr(2, length);
  }

  private async checkSendLimit(account: string, type: string) {
    // 检查发送频率限制
    // 这里需要实现缓存逻辑
  }

  private async sendSmsCode(mobile: string, code: string) {
    // 发送短信验证码
    console.log(`发送短信验证码到 ${mobile}: ${code}`);
  }

  private async sendEmailCodeToUser(email: string, code: string) {
    // 发送邮件验证码
    console.log(`发送邮件验证码到 ${email}: ${code}`);
  }

  private async saveCodeToCache(account: string, code: string, type: string) {
    // 保存验证码到缓存
    console.log(`保存验证码: ${account} - ${type} - ${code}`);
  }

  private async verifyCode(
    account: string,
    code: string,
    type: string,
  ): Promise<boolean> {
    // 验证验证码
    console.log(`验证验证码: ${account} - ${type} - ${code}`);
    return true; // 示例实现
  }

  private async getWechatAccessToken(code: string): Promise<string> {
    // 获取微信access_token
    console.log(`获取微信access_token: ${code}`);
    return "mock_access_token";
  }

  private async getWechatUserInfo(accessToken: string): Promise<any> {
    // 获取微信用户信息
    console.log(`获取微信用户信息: ${accessToken}`);
    return {
      openid: "mock_openid",
      nickname: "测试用户",
      headimgurl: "https://example.com/avatar.jpg",
    };
  }
}
