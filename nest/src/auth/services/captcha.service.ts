// @ts-nocheck
import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../redis/redis.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CaptchaService {
  private readonly attempts = new Map<
    string,
    { count: number; expires: number }
  >();
  private readonly MAX_ATTEMPTS = 3;
  private readonly ATTEMPT_TTL = 120; // 2 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  // 生成验证码
  generateCaptcha(range: string = ''): {
    data: string;
    uuid: string;
  } {
    // 生成uuid (使用UUID库)
    const uuid = uuidv4();

    // 生成验证码key (格式: captcha:range:uuid)
    const captchaKey = `captcha:${range}:${uuid}`;

    // 生成4位验证码 (使用PHP相同的字符集)
    const chars = '2345678abcdefhijkmnpqrstuvwxyzABCDEFGHJKLMNPQRTUVWXY';
    let captchaText = '';
    for (let i = 0; i < 4; i++) {
      captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 存储验证码到Redis (1分钟过期，与PHP保持一致)
    this.redisService.set(captchaKey, {
      text: captchaText,
    }, { ttl: 60 });

    // 返回与PHP相同的格式
    return {
      data: `data:image/png;base64,${Buffer.from(captchaText).toString('base64')}`,
      uuid: uuid,
    };
  }

  // 验证验证码 (支持range和uuid参数)
  async verifyCaptcha(range: string, uuid: string, captchaCode: string): Promise<boolean> {
    // 构建验证码key
    const captchaKey = `captcha:${range}:${uuid}`;

    // 从Redis获取验证码
    const storedCaptcha = await this.redisService.get<{ text: string }>(captchaKey);

    if (!storedCaptcha) {
      return false;
    }

    // 验证码不区分大小写
    const isValid = storedCaptcha.text.toLowerCase() === captchaCode.toLowerCase();

    // 验证后删除 (一次性使用)
    await this.redisService.del(captchaKey);

    return isValid;
  }

  async verify(
    tag: string,
    token?: string,
    allowNoCheckTimes: number = this.MAX_ATTEMPTS,
  ): Promise<boolean> {
    const attemptKey = `accessTimes:${tag}`;
    const attempts = this.getAttempts(attemptKey);

    if (attempts <= allowNoCheckTimes) {
      await this.incrementAttempts(attemptKey);
      return true;
    }

    if (!token) {
      throw new BadRequestException("需要行为验证");
    }

    // Here you would validate the captcha token against a real captcha service
    // For now, we'll simulate it
    return this.validateCaptchaToken(token);
  }

  private getAttempts(tag: string): number {
    const attemptData = this.attempts.get(tag);

    if (!attemptData) {
      return 0;
    }

    if (Date.now() > attemptData.expires) {
      this.attempts.delete(tag);
      return 0;
    }

    return attemptData.count;
  }

  private async incrementAttempts(tag: string): Promise<void> {
    const currentAttempts = this.getAttempts(tag);
    const expires = Date.now() + this.ATTEMPT_TTL * 1000;

    this.attempts.set(tag, {
      count: currentAttempts + 1,
      expires,
    });
  }

  private validateCaptchaToken(token: string): boolean {
    // In a real implementation, you would validate against a captcha service
    // For now, accept any non-empty token as valid
    return token && token.length > 0;
  }

  async trackFailedLogin(username: string): Promise<number> {
    const tag = `userSignin:${username}`;
    return this.getAttempts(tag);
  }

  async requiresCaptcha(username: string): Promise<boolean> {
    const tag = `userSignin:${username}`;
    return this.getAttempts(tag) > this.MAX_ATTEMPTS;
  }
}
