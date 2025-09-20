import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  RechargeOrderQueryDto,
  CreateRechargeOrderDto,
  RechargePayDto,
  CheckRechargeStatusDto,
  RechargeOrderStatus,
} from './dto/user-recharge-order.dto';

@Injectable()
export class UserRechargeOrderService {
  constructor(private prisma: PrismaService) {}

  async getRechargeList(userId: number, query: RechargeOrderQueryDto) {
    const { page = 1, size = 15, status, keyword, sort_field = 'add_time', sort_order = 'desc' } = query;
    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = {
      user_id: userId,
      is_delete: 0,
    };

    if (status !== undefined) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { order_sn: { contains: keyword } },
        { postscript: { contains: keyword } },
      ];
    }

    // 获取充值和提现记录
    const [rechargeOrders, withdrawOrders, rechargeTotal, withdrawTotal] = await Promise.all([
      this.prisma.userRechargeOrder.findMany({
        where,
        orderBy: { [sort_field]: sort_order },
        skip,
        take: size,
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              mobile: true,
            },
          },
        },
      }),
      this.prisma.userWithdrawApply.findMany({
        where: {
          user_id: userId,
          is_delete: 0,
          ...(status !== undefined && { status }),
        },
        orderBy: { [sort_field]: sort_order },
        skip,
        take: size,
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              mobile: true,
            },
          },
        },
      }),
      this.prisma.userRechargeOrder.count({ where }),
      this.prisma.userWithdrawApply.count({
        where: {
          user_id: userId,
          is_delete: 0,
          ...(status !== undefined && { status }),
        },
      }),
    ]);

    // 合并记录并添加类型标识
    const allRecords = [
      ...rechargeOrders.map(order => ({
        ...order,
        type: '充值',
        type_key: 'recharge',
        amount: order.amount,
        add_time: order.add_time,
        status: order.status,
      })),
      ...withdrawOrders.map(order => ({
        ...order,
        type: '提现',
        type_key: 'withdraw',
        amount: order.amount,
        add_time: order.add_time,
        status: order.status,
      })),
    ];

    // 按指定字段排序
    allRecords.sort((a, b) => {
      if (sort_order === 'asc') {
        return a[sort_field] - b[sort_field];
      } else {
        return b[sort_field] - a[sort_field];
      }
    });

    const total = rechargeTotal + withdrawTotal;
    const records = allRecords.slice(0, size);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
        page,
        size,
      },
    };
  }

  async createRechargeOrder(userId: number, body: CreateRechargeOrderDto) {
    const { setting_id, amount } = body;

    let rechargeAmount = 0;
    let discountMoney = 0;

    if (amount && amount > 0) {
      // 自定义金额，查找最大的优惠金额
      const setting = await this.prisma.rechargeSetting.findFirst({
        where: {
          money: { lte: amount },
          is_show: 1,
          is_delete: 0,
        },
        orderBy: { money: 'desc' },
      });

      rechargeAmount = amount;
      discountMoney = setting?.discount_money || 0;
    } else if (setting_id) {
      // 使用预设金额
      const setting = await this.prisma.rechargeSetting.findFirst({
        where: {
          setting_id,
          is_show: 1,
          is_delete: 0,
        },
      });

      if (!setting) {
        throw new NotFoundException('充值套餐不存在');
      }

      rechargeAmount = setting.money;
      discountMoney = setting.discount_money;
    } else {
      throw new BadRequestException('请输入充值金额或选择充值套餐');
    }

    // 生成订单号
    const orderSn = this.generateOrderSn();

    // 创建充值订单
    const order = await this.prisma.userRechargeOrder.create({
      data: {
        user_id: userId,
        order_sn: orderSn,
        amount: rechargeAmount,
        discount_money: discountMoney,
        status: RechargeOrderStatus.PENDING,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: '创建成功',
      data: {
        order_id: order.order_id,
        order_sn: orderSn,
        amount: rechargeAmount,
        discount_money: discountMoney,
        total_amount: rechargeAmount + discountMoney,
      },
    };
  }

  async getRechargeOrder(orderId: number, userId?: number) {
    const where: any = { order_id: orderId, is_delete: 0 };
    if (userId) {
      where.user_id = userId;
    }

    const order = await this.prisma.userRechargeOrder.findFirst({
      where,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            mobile: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('充值订单不存在');
    }

    return {
      code: 200,
      message: '获取成功',
      data: order,
    };
  }

  async getRechargeSettings() {
    const settings = await this.prisma.rechargeSetting.findMany({
      where: {
        is_show: 1,
        is_delete: 0,
      },
      orderBy: { sort_order: 'asc' },
    });

    return {
      code: 200,
      message: '获取成功',
      data: settings,
    };
  }

  async getAvailablePayments() {
    const payments = await this.prisma.payment.findMany({
      where: {
        is_show: 1,
        is_delete: 0,
        type: 'recharge',
      },
      orderBy: { sort_order: 'asc' },
    });

    // 过滤掉线下支付
    const availablePayments = payments.filter(payment => payment.code !== 'offline');

    return {
      code: 200,
      message: '获取成功',
      data: availablePayments,
    };
  }

  async processRechargePayment(userId: number, body: RechargePayDto) {
    const { order_id, pay_type, code } = body;

    const order = await this.getRechargeOrder(order_id, userId);

    if (order.data.status === RechargeOrderStatus.SUCCESS) {
      throw new ConflictException('订单已支付');
    }

    if (order.data.status === RechargeOrderStatus.FAILED) {
      throw new ConflictException('订单已失败');
    }

    // 获取支付方式信息
    const payment = await this.prisma.payment.findFirst({
      where: {
        code: pay_type,
        is_show: 1,
        is_delete: 0,
      },
    });

    if (!payment) {
      throw new NotFoundException('支付方式不存在');
    }

    // 获取openid（微信支付需要）
    let openid = '';
    if (pay_type.includes('wechat') && code) {
      openid = await this.getWechatOpenid(code);
    }

    // 创建支付日志
    const payLog = await this.prisma.payLog.create({
      data: {
        order_id,
        order_type: 1, // 充值订单
        order_sn: order.data.order_sn,
        order_amount: order.data.amount + order.data.discount_money,
        pay_code: pay_type,
        pay_name: payment.name,
        add_time: Math.floor(Date.now() / 1000),
        user_id: userId,
        openid,
      },
    });

    // 根据支付方式处理支付
    let payInfo;
    switch (pay_type) {
      case 'wechat':
        payInfo = await this.processWechatPay(payLog);
        break;
      case 'alipay':
        payInfo = await this.processAlipay(payLog);
        break;
      case 'paypal':
        payInfo = await this.processPaypal(payLog);
        break;
      default:
        throw new BadRequestException('不支持的支付方式');
    }

    return {
      code: 200,
      message: '创建支付成功',
      data: {
        order_id,
        order_amount: order.data.amount + order.data.discount_money,
        pay_info,
      },
    };
  }

  async checkRechargeStatus(orderId: number, userId?: number) {
    const order = await this.getRechargeOrder(orderId, userId);

    return {
      code: 200,
      message: '获取成功',
      data: {
        status: order.data.status,
        status_text: this.getStatusText(order.data.status),
      },
    };
  }

  async getRechargeStats(userId: number) {
    const [totalRecharge, successRecharge, pendingRecharge] = await Promise.all([
      this.prisma.userRechargeOrder.aggregate({
        where: {
          user_id: userId,
          is_delete: 0,
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.userRechargeOrder.aggregate({
        where: {
          user_id: userId,
          status: RechargeOrderStatus.SUCCESS,
          is_delete: 0,
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.userRechargeOrder.aggregate({
        where: {
          user_id: userId,
          status: RechargeOrderStatus.PENDING,
          is_delete: 0,
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        total_amount: totalRecharge._sum.amount || 0,
        total_count: totalRecharge._count,
        success_amount: successRecharge._sum.amount || 0,
        success_count: successRecharge._count,
        pending_amount: pendingRecharge._sum.amount || 0,
        pending_count: pendingRecharge._count,
      },
    };
  }

  // 私有方法
  private generateOrderSn(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RC${timestamp}${random}`;
  }

  private getStatusText(status: number): string {
    switch (status) {
      case RechargeOrderStatus.PENDING:
        return '待支付';
      case RechargeOrderStatus.SUCCESS:
        return '充值成功';
      case RechargeOrderStatus.FAILED:
        return '充值失败';
      default:
        return '未知状态';
    }
  }

  private async getWechatOpenid(code: string): Promise<string> {
    // 这里需要实现微信OAuth获取openid的逻辑
    // 临时返回空字符串
    return '';
  }

  private async processWechatPay(payLog: any): Promise<any> {
    // 这里需要实现微信支付逻辑
    return {
      type: 'wechat',
      params: {
        appId: process.env.WECHAT_APP_ID,
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        nonceStr: Math.random().toString(36).substr(2, 32),
        package: `prepay_id=${payLog.paylog_id}`,
        signType: 'RSA',
      },
    };
  }

  private async processAlipay(payLog: any): Promise<any> {
    // 这里需要实现支付宝支付逻辑
    return {
      type: 'alipay',
      params: {
        orderString: `alipay_sdk=alipay-sdk-php-20161101&app_id=${process.env.ALIPAY_APP_ID}&biz_content=${encodeURIComponent(JSON.stringify({
          out_trade_no: payLog.order_sn,
          total_amount: payLog.order_amount,
          subject: '账户充值',
        }))}`,
      },
    };
  }

  private async processPaypal(payLog: any): Promise<any> {
    // 这里需要实现PayPal支付逻辑
    return {
      type: 'paypal',
      params: {
        orderId: payLog.paylog_id,
        amount: payLog.order_amount,
        currency: 'USD',
      },
    };
  }

  // 处理支付回调
  async handlePaymentCallback(payLogId: number, paymentData: any) {
    const payLog = await this.prisma.payLog.findFirst({
      where: { paylog_id: payLogId },
    });

    if (!payLog) {
      throw new NotFoundException('支付日志不存在');
    }

    if (payLog.is_paid) {
      return { code: 200, message: '已处理', data: null };
    }

    // 更新支付日志
    await this.prisma.payLog.update({
      where: { paylog_id: payLogId },
      data: {
        is_paid: 1,
        paid_time: Math.floor(Date.now() / 1000),
        payment_data: JSON.stringify(paymentData),
      },
    });

    // 更新充值订单状态
    const order = await this.prisma.userRechargeOrder.update({
      where: { order_id: payLog.order_id },
      data: {
        status: RechargeOrderStatus.SUCCESS,
        paid_time: Math.floor(Date.now() / 1000),
        postscript: paymentData.transaction_id || '充值成功',
      },
    });

    // 更新用户余额
    await this.prisma.user.update({
      where: { user_id: order.user_id },
      data: {
        balance: {
          increment: order.amount + order.discount_money,
        },
      },
    });

    // 创建余额变动记录
    await this.prisma.userBalanceLog.create({
      data: {
        user_id: order.user_id,
        balance: order.amount + order.discount_money,
        change_desc: '账户充值',
        change_type: 1,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return { code: 200, message: '处理成功', data: null };
  }
}