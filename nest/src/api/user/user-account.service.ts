// @ts-nocheck
import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BalanceQueryDto, WithdrawApplyDto, RechargeOrderDto, SetWithdrawPasswordDto, VerifyWithdrawPasswordDto } from './dto/user-account.dto';

@Injectable()
export class UserAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getBalanceDetail(userId: number) {
    const userBalance = await this.prisma.user_balance.findUnique({
      where: { user_id: userId },
    });

    if (!userBalance) {
      throw new NotFoundException('用户账户不存在');
    }

    return {
      balance: userBalance.balance,
      frozen_balance: userBalance.frozen_balance,
    };
  }

  async getBalanceLog(userId: number, queryDto: BalanceQueryDto) {
    const { page = 1, size = 10, type = 'all' } = queryDto;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };

    if (type !== 'all') {
      where.balance_type = type === 'income' ? 1 : 0; // 1: 收入, 0: 支出
    }

    const [logs, total] = await Promise.all([
      this.prisma.user_balance_log.findMany({
        where,
        skip,
        take: size,
        orderBy: { add_time: 'desc' },
        select: {
          log_id: true,
          balance: true,
          balance_type: true,
          description: true,
          add_time: true,
        },
      }),
      this.prisma.user_balance_log.count({ where }),
    ]);

    return {
      list: logs,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async withdrawApply(userId: number, withdrawDto: WithdrawApplyDto) {
    const { amount, withdraw_password, remark } = withdrawDto;

    // 检查用户余额
    const userBalance = await this.prisma.user_balance.findUnique({
      where: { user_id: userId },
    });

    if (!userBalance || userBalance.balance < amount) {
      throw new BadRequestException('余额不足');
    }

    // 验证提现密码
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { withdraw_password: true },
    });

    if (!user?.withdraw_password) {
      throw new BadRequestException('请先设置提现密码');
    }

    const isPasswordValid = await bcrypt.compare(withdraw_password, user.withdraw_password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('提现密码错误');
    }

    // 检查最低提现金额
    const minWithdrawAmount = this.configService.get<number>('MIN_WITHDRAW_AMOUNT', 1);
    if (amount < minWithdrawAmount) {
      throw new BadRequestException(`最低提现金额为${minWithdrawAmount}元`);
    }

    // 检查提现手续费
    const withdrawFee = this.configService.get<number>('WITHDRAW_FEE_RATE', 0);
    const fee = amount * (withdrawFee / 100);
    const actualAmount = amount - fee;

    if (actualAmount <= 0) {
      throw new BadRequestException('提现金额扣除手续费后为0，无法提现');
    }

    // 创建提现申请
    const withdrawApply = await this.prisma.user_withdraw_apply.create({
      data: {
        user_id: userId,
        amount,
        actual_amount: actualAmount,
        fee,
        withdraw_password: user.withdraw_password,
        status: 0, // 待审核
        add_time: Math.floor(Date.now() / 1000),
        remark,
      },
    });

    // 冻结余额
    await this.prisma.user_balance.update({
      where: { user_id: userId },
      data: {
        balance: {
          decrement: amount,
        },
        frozen_balance: {
          increment: amount,
        },
      },
    });

    // 记录余额日志
    await this.prisma.user_balance_log.create({
      data: {
        user_id: userId,
        balance: -amount,
        balance_type: 0, // 支出
        description: `提现申请 #${withdrawApply.apply_id}`,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return { apply_id: withdrawApply.apply_id };
  }

  async rechargeOrder(userId: number, rechargeDto: RechargeOrderDto) {
    const { amount, payment_method, remark } = rechargeDto;

    // 检查充值金额
    const minRechargeAmount = this.configService.get<number>('MIN_RECHARGE_AMOUNT', 0.01);
    if (amount < minRechargeAmount) {
      throw new BadRequestException(`最低充值金额为${minRechargeAmount}元`);
    }

    // 创建充值订单
    const rechargeOrder = await this.prisma.user_recharge_order.create({
      data: {
        user_id: userId,
        amount,
        payment_method,
        status: 0, // 待支付
        add_time: Math.floor(Date.now() / 1000),
        remark,
      },
    });

    // 生成支付参数
    const payParams = await this.generatePayParams(rechargeOrder.order_sn, amount, payment_method);

    return {
      order_id: rechargeOrder.order_id,
      order_sn: rechargeOrder.order_sn,
      amount: rechargeOrder.amount,
      pay_params: payParams,
    };
  }

  async setWithdrawPassword(userId: number, setPasswordDto: SetWithdrawPasswordDto) {
    const { password, confirm_password } = setPasswordDto;

    if (password !== confirm_password) {
      throw new BadRequestException('密码确认不一致');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { withdraw_password: hashedPassword },
    });

    return { success: true };
  }

  async verifyWithdrawPassword(userId: number, verifyDto: VerifyWithdrawPasswordDto) {
    const { password } = verifyDto;

    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { withdraw_password: true },
    });

    if (!user?.withdraw_password) {
      throw new BadRequestException('请先设置提现密码');
    }

    const isPasswordValid = await bcrypt.compare(password, user.withdraw_password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('提现密码错误');
    }

    return { valid: true };
  }

  async getWithdrawList(userId: number, queryDto: BalanceQueryDto) {
    const { page = 1, size = 10 } = queryDto;
    const skip = (page - 1) * size;

    const [withdraws, total] = await Promise.all([
      this.prisma.user_withdraw_apply.findMany({
        where: { user_id: userId },
        skip,
        take: size,
        orderBy: { add_time: 'desc' },
        select: {
          apply_id: true,
          amount: true,
          actual_amount: true,
          fee: true,
          status: true,
          add_time: true,
          remark: true,
        },
      }),
      this.prisma.user_withdraw_apply.count({ where: { user_id: userId } }),
    ]);

    return {
      list: withdraws,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getRechargeList(userId: number, queryDto: BalanceQueryDto) {
    const { page = 1, size = 10 } = queryDto;
    const skip = (page - 1) * size;

    const [recharges, total] = await Promise.all([
      this.prisma.user_recharge_order.findMany({
        where: { user_id: userId },
        skip,
        take: size,
        orderBy: { add_time: 'desc' },
        select: {
          order_id: true,
          order_sn: true,
          amount: true,
          payment_method: true,
          status: true,
          add_time: true,
          pay_time: true,
        },
      }),
      this.prisma.user_recharge_order.count({ where: { user_id: userId } }),
    ]);

    return {
      list: recharges,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  private async generatePayParams(orderSn: string, amount: number, paymentMethod: string) {
    // 这里需要根据不同的支付方式生成对应的支付参数
    // 实际项目中需要集成微信支付、支付宝等支付接口
    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');

    switch (paymentMethod) {
      case 'wechat':
        return {
          pay_type: 'wechat',
          pay_url: `${baseUrl}/api/payment/wechat/pay?order_sn=${orderSn}`,
          order_sn,
          amount,
        };

      case 'alipay':
        return {
          pay_type: 'alipay',
          pay_url: `${baseUrl}/api/payment/alipay/pay?order_sn=${orderSn}`,
          order_sn,
          amount,
        };

      case 'bank':
        return {
          pay_type: 'bank',
          bank_info: {
            account_name: 'Tigshop商城',
            account_number: '6222080200001234567',
            bank_name: '工商银行',
          },
          order_sn,
          amount,
        };

      default:
        throw new BadRequestException('不支持的支付方式');
    }
  }
}
