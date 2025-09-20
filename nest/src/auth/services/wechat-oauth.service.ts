import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class WechatOAuthService {
  async getOAuthUrl(url: string) {
    return { url: url, ticket: '' };
  }

  async auth(code: string) {
    return { openid: 'mock_openid', errcode: 0 };
  }

  async getMiniUserMobile(code: string) {
    return { code: 0, msg: 'success' };
  }

  async getMiniOpenid(code: string) {
    return 'mock_openid';
  }

  async getJsSdkConfig(url: string) {
    return {};
  }
}