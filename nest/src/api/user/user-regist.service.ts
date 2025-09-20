// @ts-nocheck
import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../../common/sms/sms.service';
import { EmailService } from '../../common/email/email.service';
import { RegistDto } from './dto/user-regist.dto';

@Injectable()
export class UserRegistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  async generateUsername(): Promise<string> {
    // 生成随机用户名
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `user_${timestamp}_${random}`;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { username },
    });
    return !!user;
  }

  async checkMobileExists(mobile: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { mobile },
    });
    return !!user;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });
    return !!user;
  }

  async regist(registDto: RegistDto) {
    // 检查是否允许注册
    const shopRegClosed = this.configService.get<string>('SHOP_REG_CLOSED', '0');
    if (shopRegClosed === '1') {
      throw new BadRequestException('商城已停止注册！');
    }

    const { regist_type, password, salesman_id = 0, referrer_user_id = 0 } = registDto;

    // 生成用户名
    let username = registDto.username;
    if (!username) {
      username = await this.generateUsername();
    }

    // 检查用户名是否已存在
    if (await this.checkUsernameExists(username)) {
      throw new ConflictException('用户名已存在');
    }

    let userData: any = {
      username,
      password: await bcrypt.hash(password, 10),
      referrer_user_id,
      salesman_id,
      add_time: Math.floor(Date.now() / 1000),
      last_login: Math.floor(Date.now() / 1000),
      is_using: 1,
    };

    if (regist_type === 'mobile') {
      const { mobile, mobile_code } = registDto;

      if (!mobile) {
        throw new BadRequestException('手机号不能为空');
      }

      if (!mobile_code) {
        throw new BadRequestException('短信验证码不能为空');
      }

      // 验证短信验证码
      const isValid = await this.smsService.checkCode(mobile, mobile_code);
      if (!isValid) {
        throw new UnauthorizedException('短信验证码错误或已过期，请重试');
      }

      // 检查手机号是否已存在
      if (await this.checkMobileExists(mobile)) {
        throw new ConflictException('手机号已存在');
      }

      userData.mobile = mobile;
    } else if (regist_type === 'email') {
      const { email, email_code } = registDto;

      if (!email) {
        throw new BadRequestException('邮箱不能为空');
      }

      if (!email_code) {
        throw new BadRequestException('邮箱验证码不能为空');
      }

      // 验证邮箱验证码
      const isValid = await this.emailService.checkCode(email, email_code, 'register_code');
      if (!isValid) {
        throw new UnauthorizedException('邮箱验证码错误或已过期，请重试');
      }

      // 检查邮箱是否已存在
      if (await this.checkEmailExists(email)) {
        throw new ConflictException('邮箱已存在');
      }

      userData.email = email;
    }

    // 创建用户
    const user = await this.prisma.user.create({
      data: userData,
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

    // 如果有推荐人，增加推荐人积分
    if (referrer_user_id > 0) {
      await this.addReferrerPoints(referrer_user_id);
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  private async addReferrerPoints(referrerUserId: number) {
    // 给推荐人增加积分
    const referralPoints = this.configService.get<number>('REFERRAL_POINTS', 10);

    await this.prisma.user_points.update({
      where: { user_id: referrerUserId },
      data: {
        points: {
          increment: referralPoints,
        },
      },
    });

    // 记录积分日志
    await this.prisma.user_points_log.create({
      data: {
        user_id: referrerUserId,
        points: referralPoints,
        log_type: 'referral',
        description: '推荐用户注册奖励',
        add_time: Math.floor(Date.now() / 1000),
      },
    });
  }

  async sendEmailCode(email: string) {
    if (!email) {
      throw new BadRequestException('邮箱不能为空');
    }

    // 检查邮箱是否已注册
    if (await this.checkEmailExists(email)) {
      throw new ConflictException('该邮箱已注册');
    }

    // 发送邮箱验证码
    await this.emailService.sendEmailCode(email, 'register_code');

    return { message: '发送成功！' };
  }
}
