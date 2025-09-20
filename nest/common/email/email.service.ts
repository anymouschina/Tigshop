import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendEmailCode(email: string, type: string) {
    if (!email) {
      throw new BadRequestException('邮箱不能为空');
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码到Redis，5分钟过期
    const key = `email_code:${email}:${type}`;
    await this.redis.setex(key, 300, code);

    // 发送邮件
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: '验证码',
      html: `<p>您的验证码是：<strong>${code}</strong></p><p>验证码5分钟内有效，请尽快完成验证。</p>`,
    };

    await this.transporter.sendMail(mailOptions);

    return { message: '发送成功！' };
  }

  async checkCode(email: string, code: string, type: string): Promise<boolean> {
    if (!email || !code || !type) {
      return false;
    }

    const key = `email_code:${email}:${type}`;
    const storedCode = await this.redis.get(key);

    if (!storedCode || storedCode !== code) {
      return false;
    }

    // 验证成功后删除验证码
    await this.redis.del(key);

    return true;
  }
}