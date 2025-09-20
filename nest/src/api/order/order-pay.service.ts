// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class OrderPayService {
  constructor(private prisma: PrismaService) {}

  async getPaymentInfo(userId: number, orderId: number) {
    // 验证订单
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
      },
      include: {
        order_items: true,
        user_address: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.order_status !== 1) {
      throw new BadRequestException('订单状态不正确，无法支付');
    }

    // 获取支付方式
    const paymentTypes = await this.getAvailablePaymentTypes();

    // 构建支付信息
    const paymentInfo = {
      order: {
        order_id: order.order_id,
        order_sn: order.order_sn,
        total_amount: order.total_amount,
        shipping_fee: order.shipping_fee,
        pay_amount: order.pay_amount,
        order_status: order.order_status,
        create_time: order.add_time,
      },
      items: order.order_items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        product_price: item.product_price,
        product_num: item.product_num,
        total_amount: item.total_amount,
      })),
      address: order.user_address ? {
        name: order.user_address.name,
        mobile: order.user_address.mobile,
        province: order.user_address.province,
        city: order.user_address.city,
        district: order.user_address.district,
        address: order.user_address.address,
      } : null,
      payment_types: paymentTypes,
    };

    return {
      code: 200,
      message: '获取成功',
      data: paymentInfo,
    };
  }

  async checkPaymentStatus(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return {
      code: 200,
      message: '检查成功',
      data: {
        order_id: order.order_id,
        order_sn: order.order_sn,
        order_status: order.order_status,
        pay_status: order.pay_status,
        pay_time: order.pay_time,
      },
    };
  }

  async getPaymentLog(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const paymentLogs = await this.prisma.pay_log.findMany({
      where: {
        order_id: orderId,
      },
      orderBy: {
        add_time: 'desc',
      },
    });

    return {
      code: 200,
      message: '获取成功',
      data: paymentLogs,
    };
  }

  async createPayment(userId: number, orderId: number, payType: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
        order_status: 1,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在或状态不正确');
    }

    // 验证支付方式
    const validPayTypes = ['wechat', 'alipay', 'balance'];
    if (!validPayTypes.includes(payType)) {
      throw new BadRequestException('不支持的支付方式');
    }

    // 如果是余额支付，检查余额
    if (payType === 'balance') {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!user || user.user_money < order.pay_amount) {
        throw new BadRequestException('余额不足');
      }
    }

    // 创建支付记录
    const paymentRecord = await this.prisma.pay_log.create({
      data: {
        order_id: orderId,
        user_id: userId,
        pay_type: payType,
        pay_amount: order.pay_amount,
        pay_status: 0,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 根据支付方式生成支付参数
    let paymentParams;
    switch (payType) {
      case 'wechat':
        paymentParams = await this.generateWechatPayment(order, paymentRecord);
        break;
      case 'alipay':
        paymentParams = await this.generateAlipayPayment(order, paymentRecord);
        break;
      case 'balance':
        paymentParams = await this.processBalancePayment(userId, order, paymentRecord);
        break;
      default:
        throw new BadRequestException('不支持的支付方式');
    }

    return {
      code: 200,
      message: '创建支付成功',
      data: {
        payment_id: paymentRecord.pay_id,
        pay_type: payType,
        payment_params: paymentParams,
      },
    };
  }

  async handlePaymentNotify(body: any) {
    try {
      // 验证支付回调数据
      const paymentData = this.validatePaymentNotify(body);

      // 更新订单状态
      await this.updateOrderPaymentStatus(paymentData.order_id, paymentData);

      return { code: 200, message: 'success' };
    } catch (error) {
      return { code: 400, message: error.message };
    }
  }

  async handleRefundNotify(body: any) {
    try {
      // 验证退款回调数据
      const refundData = this.validateRefundNotify(body);

      // 更新退款状态
      await this.updateOrderRefundStatus(refundData.order_id, refundData);

      return { code: 200, message: 'success' };
    } catch (error) {
      return { code: 400, message: error.message };
    }
  }

  private async getAvailablePaymentTypes() {
    return [
      { id: 1, name: '微信支付', code: 'wechat', icon: 'wechat', is_available: 1 },
      { id: 2, name: '支付宝', code: 'alipay', icon: 'alipay', is_available: 1 },
      { id: 3, name: '余额支付', code: 'balance', icon: 'balance', is_available: 1 },
    ].filter(type => type.is_available === 1);
  }

  private async generateWechatPayment(order: any, paymentRecord: any) {
    // 生成微信支付参数
    // 这里需要集成微信支付SDK
    return {
      appId: process.env.WECHAT_APP_ID,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: Math.random().toString(36).substr(2),
      package: `prepay_id=${this.generatePrepayId()}`,
      signType: 'RSA',
    };
  }

  private async generateAlipayPayment(order: any, paymentRecord: any) {
    // 生成支付宝支付参数
    // 这里需要集成支付宝SDK
    return {
      order_string: this.generateAlipayOrderString(order, paymentRecord),
    };
  }

  private async processBalancePayment(userId: number, order: any, paymentRecord: any) {
    // 处理余额支付
    await this.prisma.$transaction(async (prisma) => {
      // 扣除用户余额
      await prisma.user.update({
        where: { user_id: userId },
        data: { user_money: { decrement: order.pay_amount } },
      });

      // 更新订单状态
      await prisma.order.update({
        where: { order_id: order.order_id },
        data: {
          order_status: 2, // 已付款
          pay_status: 1,
          pay_time: Math.floor(Date.now() / 1000),
        },
      });

      // 更新支付记录
      await prisma.pay_log.update({
        where: { pay_id: paymentRecord.pay_id },
        data: {
          pay_status: 1,
          pay_time: Math.floor(Date.now() / 1000),
        },
      });

      // 添加账户变动记录
      await prisma.user_account_log.create({
        data: {
          user_id: userId,
          amount: -order.pay_amount,
          balance_type: 1, // 余额
          change_type: 2, // 订单支付
          order_id: order.order_id,
          remark: `订单支付：${order.order_sn}`,
          add_time: Math.floor(Date.now() / 1000),
        },
      });
    });

    return {
      success: true,
      message: '支付成功',
    };
  }

  private validatePaymentNotify(body: any) {
    // 验证支付回调数据
    // 这里需要根据具体支付平台的规则进行验证
    return {
      order_id: body.out_trade_no,
      transaction_id: body.transaction_id,
      pay_amount: parseFloat(body.total_amount),
      pay_time: Math.floor(Date.now() / 1000),
    };
  }

  private validateRefundNotify(body: any) {
    // 验证退款回调数据
    return {
      order_id: body.out_trade_no,
      refund_id: body.refund_id,
      refund_amount: parseFloat(body.refund_fee),
      refund_time: Math.floor(Date.now() / 1000),
    };
  }

  private async updateOrderPaymentStatus(orderId: number, paymentData: any) {
    await this.prisma.$transaction(async (prisma) => {
      // 更新订单状态
      await prisma.order.update({
        where: { order_id: orderId },
        data: {
          order_status: 2, // 已付款
          pay_status: 1,
          pay_time: paymentData.pay_time,
          transaction_id: paymentData.transaction_id,
        },
      });

      // 更新支付记录
      await prisma.pay_log.updateMany({
        where: { order_id: orderId },
        data: {
          pay_status: 1,
          pay_time: paymentData.pay_time,
          transaction_id: paymentData.transaction_id,
        },
      });
    });
  }

  private async updateOrderRefundStatus(orderId: number, refundData: any) {
    await this.prisma.$transaction(async (prisma) => {
      // 更新订单退款状态
      await prisma.order.update({
        where: { order_id: orderId },
        data: {
          refund_status: 2, // 已退款
          refund_time: refundData.refund_time,
          refund_amount: refundData.refund_amount,
        },
      });

      // 添加退款记录
      await prisma.refund_log.create({
        data: {
          order_id: orderId,
          refund_id: refundData.refund_id,
          refund_amount: refundData.refund_amount,
          refund_status: 2,
          refund_time: refundData.refund_time,
        },
      });
    });
  }

  private generatePrepayId(): string {
    // 生成预支付ID
    return `prepay_${Date.now()}_${Math.random().toString(36).substr(2)}`;
  }

  private generateAlipayOrderString(order: any, paymentRecord: any): string {
    // 生成支付宝订单字符串
    return `alipay_sdk_version=3.0.0&app_id=${process.env.ALIPAY_APP_ID}&charset=utf-8&method=alipay.trade.app.pay&notify_url=${process.env.ALIPAY_NOTIFY_URL}&out_trade_no=${order.order_sn}&total_amount=${order.pay_amount}&subject=${order.order_sn}`;
  }
}
