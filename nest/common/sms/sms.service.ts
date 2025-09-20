import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class SmsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async sendCode(mobile: string) {
    if (!mobile) {
      throw new BadRequestException('手机号不能为空');
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码到Redis，5分钟过期
    const key = `sms_code:${mobile}`;
    await this.redis.setex(key, 300, code);

    // 这里应该调用真实的短信服务API
    // 暂时模拟发送，实际使用时需要接入短信服务商
    console.log(`短信验证码已发送到 ${mobile}: ${code}`);

    return { message: '发送成功！' };
  }

  async checkCode(mobile: string, code: string): Promise<boolean> {
    if (!mobile || !code) {
      return false;
    }

    const key = `sms_code:${mobile}`;
    const storedCode = await this.redis.get(key);

    if (!storedCode || storedCode !== code) {
      return false;
    }

    // 验证成功后删除验证码
    await this.redis.del(key);

    return true;
  }
}