// @ts-nocheck
import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRegistService } from '../user-regist.service';
import { OAuthCallbackDto, OAuthProvider, OAuthUserInfoDto } from './dto/user-oauth.dto';
import * as bcrypt from 'bcrypt';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UserOauthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRegistService: UserRegistService,
    private readonly httpService: HttpService,
  ) {}

  async getAuthUrl(provider: OAuthProvider, redirectUri?: string): Promise<string> {
    const appId = this.getProviderAppId(provider);
    const redirectUrl = redirectUri || this.getRedirectUrl(provider);

    switch (provider) {
      case OAuthProvider.WECHAT:
        return `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect`;

      case OAuthProvider.QQ:
        return `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}&state=STATE`;

      case OAuthProvider.WEIBO:
        return `https://api.weibo.com/oauth2/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code`;

      case OAuthProvider.ALIPAY:
        return `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=${appId}&scope=auth_user&redirect_uri=${encodeURIComponent(redirectUrl)}`;

      default:
        throw new BadRequestException('不支持的OAuth提供商');
    }
  }

  async handleCallback(callbackDto: OAuthCallbackDto): Promise<any> {
    const { code, provider, redirectUri } = callbackDto;

    // 获取用户信息
    const userInfo = await this.getUserInfo(code, provider, redirectUri);

    if (!userInfo.openid) {
      throw new BadRequestException('获取用户信息失败');
    }

    // 查找或创建用户
    let userId = await this.findOrCreateUser(userInfo);

    // 生成JWT token
    const token = this.jwtService.sign({ userId });

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { last_login: Math.floor(Date.now() / 1000) },
    });

    return {
      type: 1,
      token,
      user: await this.getUserBasicInfo(userId),
    };
  }

  private async getUserInfo(code: string, provider: OAuthProvider, redirectUri?: string): Promise<OAuthUserInfoDto> {
    const appId = this.getProviderAppId(provider);
    const appSecret = this.getProviderAppSecret(provider);
    const redirectUrl = redirectUri || this.getRedirectUrl(provider);

    switch (provider) {
      case OAuthProvider.WECHAT:
        return await this.getWechatUserInfo(code, appId, appSecret, redirectUrl);

      case OAuthProvider.QQ:
        return await this.getQQUserInfo(code, appId, appSecret, redirectUrl);

      case OAuthProvider.WEIBO:
        return await this.getWeiboUserInfo(code, appId, appSecret, redirectUrl);

      case OAuthProvider.ALIPAY:
        return await this.getAlipayUserInfo(code, appId, redirectUrl);

      default:
        throw new BadRequestException('不支持的OAuth提供商');
    }
  }

  private async getWechatUserInfo(code: string, appId: string, appSecret: string, redirectUrl: string): Promise<OAuthUserInfoDto> {
    try {
      // 获取access_token
      const tokenResponse = await this.httpService.axiosRef.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
        params: {
          appid: appId,
          secret: appSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUrl,
        },
      });

      const tokenData = tokenResponse.data;
      if (tokenData.errcode) {
        throw new BadRequestException(`微信授权失败: ${tokenData.errmsg}`);
      }

      // 获取用户信息
      const userResponse = await this.httpService.axiosRef.get('https://api.weixin.qq.com/sns/userinfo', {
        params: {
          access_token: tokenData.access_token,
          openid: tokenData.openid,
        },
      });

      const userData = userResponse.data;
      if (userData.errcode) {
        throw new BadRequestException(`获取微信用户信息失败: ${userData.errmsg}`);
      }

      return {
        openid: userData.openid,
        provider: OAuthProvider.WECHAT,
        nickname: userData.nickname,
        avatar: userData.headimgurl,
        unionid: userData.unionid,
      };
    } catch (error) {
      throw new BadRequestException('微信授权处理失败');
    }
  }

  private async getQQUserInfo(code: string, appId: string, appSecret: string, redirectUrl: string): Promise<OAuthUserInfoDto> {
    try {
      // 获取access_token
      const tokenResponse = await this.httpService.axiosRef.get('https://graph.qq.com/oauth2.0/token', {
        params: {
          grant_type: 'authorization_code',
          client_id: appId,
          client_secret: appSecret,
          code,
          redirect_uri: redirectUrl,
        },
      });

      const tokenData = tokenResponse.data;
      const accessTokenMatch = tokenData.match(/access_token=([^&]+)/);
      if (!accessTokenMatch) {
        throw new BadRequestException('获取QQ access_token失败');
      }

      const accessToken = accessTokenMatch[1];

      // 获取openid
      const openidResponse = await this.httpService.axiosRef.get('https://graph.qq.com/oauth2.0/me', {
        params: {
          access_token: accessToken,
        },
      });

      const openidData = JSON.parse(openidResponse.data.replace(/^[^{]*({.*})[^}]*$/, '$1'));
      if (openidData.error) {
        throw new BadRequestException(`获取QQ openid失败: ${openidData.error_description}`);
      }

      // 获取用户信息
      const userResponse = await this.httpService.axiosRef.get('https://graph.qq.com/user/get_user_info', {
        params: {
          access_token: accessToken,
          oauth_consumer_key: appId,
          openid: openidData.openid,
        },
      });

      const userData = userResponse.data;
      if (userData.ret !== 0) {
        throw new BadRequestException(`获取QQ用户信息失败: ${userData.msg}`);
      }

      return {
        openid: openidData.openid,
        provider: OAuthProvider.QQ,
        nickname: userData.nickname,
        avatar: userData.figureurl_qq_2,
      };
    } catch (error) {
      throw new BadRequestException('QQ授权处理失败');
    }
  }

  private async getWeiboUserInfo(code: string, appId: string, appSecret: string, redirectUrl: string): Promise<OAuthUserInfoDto> {
    try {
      // 获取access_token
      const tokenResponse = await this.httpService.axiosRef.post('https://api.weibo.com/oauth2/access_token', {
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUrl,
      });

      const tokenData = tokenResponse.data;
      if (tokenData.error) {
        throw new BadRequestException(`微博授权失败: ${tokenData.error_description}`);
      }

      // 获取用户信息
      const userResponse = await this.httpService.axiosRef.get('https://api.weibo.com/2/users/show.json', {
        params: {
          access_token: tokenData.access_token,
          uid: tokenData.uid,
        },
      });

      const userData = userResponse.data;
      if (userData.error) {
        throw new BadRequestException(`获取微博用户信息失败: ${userData.error}`);
      }

      return {
        openid: userData.id.toString(),
        provider: OAuthProvider.WEIBO,
        nickname: userData.screen_name,
        avatar: userData.avatar_large,
      };
    } catch (error) {
      throw new BadRequestException('微博授权处理失败');
    }
  }

  private async getAlipayUserInfo(code: string, appId: string, redirectUrl: string): Promise<OAuthUserInfoDto> {
    try {
      // 获取access_token
      const tokenResponse = await this.httpService.axiosRef.post('https://openapi.alipay.com/gateway.do', {}, {
        params: {
          method: 'alipay.system.oauth.token',
          app_id: appId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUrl,
          sign_type: 'RSA2',
        },
      });

      const tokenData = tokenResponse.data;
      if (tokenData.code !== '10000') {
        throw new BadRequestException(`支付宝授权失败: ${tokenData.msg}`);
      }

      // 获取用户信息
      const userResponse = await this.httpService.axiosRef.post('https://openapi.alipay.com/gateway.do', {}, {
        params: {
          method: 'alipay.user.info.share',
          app_id: appId,
          auth_token: tokenData.access_token,
          sign_type: 'RSA2',
        },
      });

      const userData = userResponse.data;
      if (userData.code !== '10000') {
        throw new BadRequestException(`获取支付宝用户信息失败: ${userData.msg}`);
      }

      return {
        openid: userData.user_id,
        provider: OAuthProvider.ALIPAY,
        nickname: userData.nick_name,
        avatar: userData.avatar,
      };
    } catch (error) {
      throw new BadRequestException('支付宝授权处理失败');
    }
  }

  private async findOrCreateUser(userInfo: OAuthUserInfoDto): Promise<number> {
    // 查找用户授权记录
    const authRecord = await this.prisma.user_authorize.findFirst({
      where: {
        openid: userInfo.openid,
        type: this.getProviderTypeId(userInfo.provider),
      },
    });

    if (authRecord) {
      return authRecord.user_id;
    }

    // 生成用户名
    const username = await this.userRegistService.generateUsername();

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        nickname: userInfo.nickname || username,
        password: await bcrypt.hash(Math.random().toString(36).substring(2), 10),
        avatar: userInfo.avatar,
        email: userInfo.email,
        add_time: Math.floor(Date.now() / 1000),
        last_login: Math.floor(Date.now() / 1000),
        is_using: 1,
      },
    });

    // 创建用户积分账户
    await this.prisma.user_points.create({
      data: {
        user_id: user.user_id,
        points: 0,
        frozen_points: 0,
      },
    });

    // 创建用户余额账户
    await this.prisma.user_balance.create({
      data: {
        user_id: user.user_id,
        balance: 0,
        frozen_balance: 0,
      },
    });

    // 创建用户授权记录
    await this.prisma.user_authorize.create({
      data: {
        user_id: user.user_id,
        openid: userInfo.openid,
        type: this.getProviderTypeId(userInfo.provider),
        unionid: userInfo.unionid,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return user.user_id;
  }

  private async getUserBasicInfo(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        nickname: true,
        avatar: true,
        email: true,
        mobile: true,
        user_rank: true,
        add_time: true,
      },
    });

    return user;
  }

  private getProviderAppId(provider: OAuthProvider): string {
    switch (provider) {
      case OAuthProvider.WECHAT:
        return this.configService.get<string>('WECHAT_APP_ID', '');
      case OAuthProvider.QQ:
        return this.configService.get<string>('QQ_APP_ID', '');
      case OAuthProvider.WEIBO:
        return this.configService.get<string>('WEIBO_APP_KEY', '');
      case OAuthProvider.ALIPAY:
        return this.configService.get<string>('ALIPAY_APP_ID', '');
      default:
        throw new BadRequestException('不支持的OAuth提供商');
    }
  }

  private getProviderAppSecret(provider: OAuthProvider): string {
    switch (provider) {
      case OAuthProvider.WECHAT:
        return this.configService.get<string>('WECHAT_APP_SECRET', '');
      case OAuthProvider.QQ:
        return this.configService.get<string>('QQ_APP_SECRET', '');
      case OAuthProvider.WEIBO:
        return this.configService.get<string>('WEIBO_APP_SECRET', '');
      default:
        return '';
    }
  }

  private getRedirectUrl(provider: OAuthProvider): string {
    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
    switch (provider) {
      case OAuthProvider.WECHAT:
        return `${baseUrl}/api/user/oauth/callback/wechat`;
      case OAuthProvider.QQ:
        return `${baseUrl}/api/user/oauth/callback/qq`;
      case OAuthProvider.WEIBO:
        return `${baseUrl}/api/user/oauth/callback/weibo`;
      case OAuthProvider.ALIPAY:
        return `${baseUrl}/api/user/oauth/callback/alipay`;
      default:
        throw new BadRequestException('不支持的OAuth提供商');
    }
  }

  private getProviderTypeId(provider: OAuthProvider): number {
    switch (provider) {
      case OAuthProvider.WECHAT:
        return 1;
      case OAuthProvider.QQ:
        return 2;
      case OAuthProvider.WEIBO:
        return 3;
      case OAuthProvider.ALIPAY:
        return 4;
      default:
        throw new BadRequestException('不支持的OAuth提供商');
    }
  }

  async getUserOAuthBindings(userId: number): Promise<any[]> {
    const bindings = await this.prisma.user_authorize.findMany({
      where: { user_id: userId },
      select: {
        type: true,
        openid: true,
        add_time: true,
      },
    });

    return bindings.map(binding => ({
      provider: this.getProviderName(binding.type),
      openid: binding.openid,
      add_time: binding.add_time,
    }));
  }

  private getProviderName(typeId: number): string {
    switch (typeId) {
      case 1:
        return 'wechat';
      case 2:
        return 'qq';
      case 3:
        return 'weibo';
      case 4:
        return 'alipay';
      default:
        return 'unknown';
    }
  }
}
