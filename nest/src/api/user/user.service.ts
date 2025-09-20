import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto, UpdatePasswordDto, UpdateMobileDto, UpdateEmailDto, UploadAvatarDto, UserQueryDto } from './dto/user.dto';
import { SmsService } from '../../common/sms/sms.service';
import { EmailService } from '../../common/email/email.service';
import { UserOauthService } from '../user-oauth.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly userOauthService: UserOauthService,
  ) {}

  async getUserDetail(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        nickname: true,
        avatar: true,
        email: true,
        mobile: true,
        birthday: true,
        gender: true,
        signature: true,
        user_rank: true,
        add_time: true,
        last_login: true,
        is_using: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 查询用户积分和余额
    const [userPoints, userBalance] = await Promise.all([
      this.prisma.user_points.findUnique({
        where: { user_id: userId },
        select: { points: true, frozen_points: true },
      }),
      this.prisma.user_balance.findUnique({
        where: { user_id: userId },
        select: { balance: true, frozen_balance: true },
      }),
    ]);

    // 查询用户是否授权微信
    const isBindWechat = await this.userOauthService.getUserOAuthBindings(userId).then(bindings =>
      bindings.some(binding => binding.provider === 'wechat')
    );

    // 查询是否开启签到
    const showSign = this.configService.get<string>('POINTS_SETTING', '1') === '1';

    // 查询用户是否有店铺
    const hasShop = await this.prisma.shop.findFirst({
      where: { user_id: userId, is_using: 1 },
      select: { shop_id: true, shop_name: true },
    });

    return {
      ...user,
      points: userPoints?.points || 0,
      frozen_points: userPoints?.frozen_points || 0,
      balance: userBalance?.balance || 0,
      frozen_balance: userBalance?.frozen_balance || 0,
      is_bind_wechat: isBindWechat,
      show_sign: showSign,
      has_shop: hasShop,
    };
  }

  async updateInformation(userId: number, updateDto: UpdateUserDto) {
    const { email, mobile, ...otherData } = updateDto;

    // 检查邮箱是否已被其他用户使用
    if (email) {
      const existingEmailUser = await this.prisma.user.findFirst({
        where: {
          email,
          user_id: { not: userId },
          is_using: 1,
        },
      });
      if (existingEmailUser) {
        throw new ConflictException('邮箱已被其他用户使用');
      }
    }

    // 检查手机号是否已被其他用户使用
    if (mobile) {
      const existingMobileUser = await this.prisma.user.findFirst({
        where: {
          mobile,
          user_id: { not: userId },
          is_using: 1,
        },
      });
      if (existingMobileUser) {
        throw new ConflictException('手机号已被其他用户使用');
      }
    }

    const updateData: any = { ...otherData };
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;

    const user = await this.prisma.user.update({
      where: { user_id: userId },
      data: updateData,
    });

    return { success: true };
  }

  async updatePassword(userId: number, updateDto: UpdatePasswordDto) {
    const { old_password, new_password, confirm_password } = updateDto;

    // 验证新密码确认
    if (new_password !== confirm_password) {
      throw new BadRequestException('新密码确认不一致');
    }

    // 验证旧密码
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(old_password, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('原密码错误');
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  async updateMobile(userId: number, updateDto: UpdateMobileDto) {
    const { new_mobile, code } = updateDto;

    // 验证短信验证码
    const isValid = await this.smsService.checkCode(new_mobile, code);
    if (!isValid) {
      throw new UnauthorizedException('短信验证码错误或已过期');
    }

    // 检查手机号是否已被其他用户使用
    const existingUser = await this.prisma.user.findFirst({
      where: {
        mobile: new_mobile,
        user_id: { not: userId },
        is_using: 1,
      },
    });
    if (existingUser) {
      throw new ConflictException('手机号已被其他用户使用');
    }

    // 更新手机号
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { mobile: new_mobile },
    });

    return { success: true };
  }

  async updateEmail(userId: number, updateDto: UpdateEmailDto) {
    const { new_email, code } = updateDto;

    // 验证邮箱验证码
    const isValid = await this.emailService.checkCode(new_email, code, 'bind_email');
    if (!isValid) {
      throw new UnauthorizedException('邮箱验证码错误或已过期');
    }

    // 检查邮箱是否已被其他用户使用
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: new_email,
        user_id: { not: userId },
        is_using: 1,
      },
    });
    if (existingUser) {
      throw new ConflictException('邮箱已被其他用户使用');
    }

    // 更新邮箱
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { email: new_email },
    });

    return { success: true };
  }

  async uploadAvatar(userId: number, uploadDto: UploadAvatarDto) {
    const { avatar } = uploadDto;

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { avatar },
    });

    return { success: true, avatar };
  }

  async getMemberCenter(userId: number) {
    // 获取用户基础信息
    const userInfo = await this.getUserDetail(userId);

    // 获取用户等级信息
    const userRank = await this.prisma.user_rank.findUnique({
      where: { rank_id: userInfo.user_rank },
    });

    // 获取待处理订单数量
    const [pendingOrderCount, unreadMessageCount] = await Promise.all([
      this.prisma.order.count({
        where: {
          user_id: userId,
          order_status: { in: [0, 1, 2] }, // 待付款、待发货、待收货
        },
      }),
      this.prisma.user_message.count({
        where: {
          user_id: userId,
          is_read: 0,
        },
      }),
    ]);

    // 获取优惠券数量
    const couponCount = await this.prisma.user_coupon.count({
      where: {
        user_id: userId,
        status: 0, // 未使用
        use_end_time: {
          gte: new Date(),
        },
      },
    });

    return {
      user_info: userInfo,
      user_rank: userRank,
      pending_order_count: pendingOrderCount,
      unread_message_count: unreadMessageCount,
      coupon_count: couponCount,
    };
  }

  async getUserList(queryDto: UserQueryDto) {
    const { page = 1, size = 10, keyword, sort_field = 'user_id', sort_order = 'desc' } = queryDto;
    const skip = (page - 1) * size;

    const where: any = {
      is_using: 1,
    };

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { nickname: { contains: keyword } },
        { mobile: { contains: keyword } },
        { email: { contains: keyword } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: size,
        orderBy: {
          [sort_field]: sort_order,
        },
        select: {
          user_id: true,
          username: true,
          nickname: true,
          avatar: true,
          email: true,
          mobile: true,
          user_rank: true,
          add_time: true,
          last_login: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list: users,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getUserStatistics(userId: number) {
    // 获取用户订单统计
    const [totalOrders, totalAmount, completedOrders] = await Promise.all([
      this.prisma.order.count({
        where: { user_id: userId },
      }),
      this.prisma.order.aggregate({
        where: { user_id: userId },
        _sum: { order_amount: true },
      }),
      this.prisma.order.count({
        where: {
          user_id: userId,
          order_status: 4, // 已完成
        },
      }),
    ]);

    // 获取用户收藏商品数量
    const collectCount = await this.prisma.user_collect.count({
      where: { user_id: userId },
    });

    // 获取用户地址数量
    const addressCount = await this.prisma.user_address.count({
      where: { user_id: userId },
    });

    return {
      order_count: totalOrders,
      total_amount: totalOrders._sum.order_amount || 0,
      completed_orders: completedOrders,
      collect_count: collectCount,
      address_count: addressCount,
    };
  }
}