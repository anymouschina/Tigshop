// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  CreatePaymentDto,
  PaymentMethod,
  PaymentStatus,
} from "./dto/create-payment.dto";

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentUrl?: string;
  qrCode?: string;
  transactionId?: string;
  message: string;
}

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建支付 - 对齐PHP版本 order/pay/create
   */
  async createPayment(
    userId: number,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    const {
      orderId,
      amount,
      paymentMethod,
      channelId,
      clientIp,
      userAgent,
      callbackUrl,
      remark,
    } = createPaymentDto;

    // 验证订单是否存在且属于当前用户
    const order = (await this.prisma.$queryRaw`
      SELECT * FROM "Order" WHERE id = ${orderId} AND "userId" = ${userId}
    `) as any[];

    if (!order || order.length === 0) {
      throw new NotFoundException("订单不存在");
    }

    const orderData = order[0];

    // 验证订单状态
    if (orderData.status !== "PENDING") {
      throw new BadRequestException("订单状态不允许支付");
    }

    // 验证支付金额
    if (Number(orderData.paymentAmount) !== amount) {
      throw new BadRequestException("支付金额不正确");
    }

    // 检查是否已有支付记录
    const existingPayment = (await this.prisma.$queryRaw`
      SELECT * FROM "Payment" WHERE "orderId" = ${orderId} AND status = 'SUCCESS'
    `) as any[];

    if (existingPayment && existingPayment.length > 0) {
      throw new BadRequestException("订单已支付");
    }

    // 生成支付订单号
    const paymentSn = this.generatePaymentSn();

    // 创建支付记录
    const payment = await this.prisma.$queryRaw`
      INSERT INTO "Payment" ("orderId", "paymentSn", "amount", "paymentMethod", "channelId", "clientIp", "userAgent", "callbackUrl", "remark", "status", "createdAt", "updatedAt")
      VALUES (${orderId}, ${paymentSn}, ${amount}, ${paymentMethod}, ${channelId || null}, ${clientIp || null}, ${userAgent || null}, ${callbackUrl || null}, ${remark || null}, 'PENDING', NOW(), NOW())
      RETURNING *
    `;

    // 根据支付方式生成支付信息
    const paymentInfo = await this.generatePaymentInfo(
      paymentMethod,
      paymentSn,
      amount,
      callbackUrl,
    );

    return {
      paymentId: (payment as any).id,
      orderId,
      amount,
      paymentMethod,
      status: PaymentStatus.PENDING,
      ...paymentInfo,
      message: "支付创建成功",
    };
  }

  /**
   * 获取支付状态 - 对齐PHP版本 order/pay/status
   */
  async getPaymentStatus(userId: number, paymentId: number) {
    const payment = (await this.prisma.$queryRaw`
      SELECT p.*, o."userId"
      FROM "Payment" p
      JOIN "Order" o ON p."orderId" = o.id
      WHERE p.id = ${paymentId} AND o."userId" = ${userId}
    `) as any[];

    if (!payment || payment.length === 0) {
      throw new NotFoundException("支付记录不存在");
    }

    const paymentData = payment[0];

    return {
      paymentId: paymentData.id,
      orderId: paymentData.orderId,
      amount: Number(paymentData.amount),
      paymentMethod: paymentData.paymentMethod,
      status: paymentData.status,
      transactionId: paymentData.transactionId,
      paidTime: paymentData.paidTime,
      message: "查询成功",
    };
  }

  /**
   * 支付回调 - 对齐PHP版本 order/pay/notify
   */
  async handlePaymentCallback(paymentSn: string, callbackData: any) {
    // 查找支付记录
    const payment = (await this.prisma.$queryRaw`
      SELECT * FROM "Payment" WHERE "paymentSn" = ${paymentSn}
    `) as any[];

    if (!payment || payment.length === 0) {
      throw new NotFoundException("支付记录不存在");
    }

    const paymentData = payment[0];

    // 验证回调数据（这里简化处理，实际需要根据支付平台验证签名）
    const isValid = this.validateCallback(callbackData);
    if (!isValid) {
      throw new BadRequestException("回调验证失败");
    }

    // 更新支付状态
    await this.prisma.$queryRaw`
      UPDATE "Payment"
      SET
        status = 'SUCCESS',
        transactionId = ${callbackData.transaction_id || null},
        paidTime = ${callbackData.paid_time || new Date().toISOString()},
        callbackTime = ${new Date().toISOString()},
        callbackData = ${JSON.stringify(callbackData)},
        "updatedAt" = NOW()
      WHERE id = ${paymentData.id}
    `;

    // 更新订单状态
    await this.prisma.$queryRaw`
      UPDATE "Order"
      SET
        status = 'PAID',
        "paymentStatus" = 'PAID',
        "paymentTime" = ${new Date().toISOString()},
        "updatedAt" = NOW()
      WHERE id = ${paymentData.orderId}
    `;

    return { success: true, message: "回调处理成功" };
  }

  /**
   * 申请退款 - 对齐PHP版本 order/pay/refund
   */
  async requestRefund(
    userId: number,
    paymentId: number,
    refundData: { amount?: number; reason?: string },
  ) {
    // 查找支付记录
    const payment = (await this.prisma.$queryRaw`
      SELECT p.*, o."userId"
      FROM "Payment" p
      JOIN "Order" o ON p."orderId" = o.id
      WHERE p.id = ${paymentId} AND o."userId" = ${userId}
    `) as any[];

    if (!payment || payment.length === 0) {
      throw new NotFoundException("支付记录不存在");
    }

    const paymentData = payment[0];

    // 验证支付状态
    if (paymentData.status !== "SUCCESS") {
      throw new BadRequestException("只有支付成功才能申请退款");
    }

    // 验证退款金额
    const refundAmount = refundData.amount || Number(paymentData.amount);
    if (refundAmount > Number(paymentData.amount)) {
      throw new BadRequestException("退款金额不能大于支付金额");
    }

    // 生成退款单号
    const refundSn = this.generateRefundSn();

    // 创建退款记录
    const refund = await this.prisma.$queryRaw`
      INSERT INTO "Refund" ("paymentId", "refundSn", "amount", "reason", "status", "createdAt", "updatedAt")
      VALUES (${paymentId}, ${refundSn}, ${refundAmount}, ${refundData.reason || ""}, 'PENDING', NOW(), NOW())
      RETURNING *
    `;

    // 调用支付平台退款接口（这里简化处理）
    const refundResult = await this.processRefund(
      paymentData.paymentMethod,
      refundSn,
      refundAmount,
    );

    return {
      refundId: (refund as any).id,
      refundSn,
      amount: refundAmount,
      status: "PENDING",
      message: "退款申请已提交",
    };
  }

  /**
   * 获取支付方式列表 - 对齐PHP版本 order/pay/paymentMethods
   */
  async getPaymentMethods() {
    return [
      {
        id: "alipay",
        name: "支付宝",
        icon: "/images/payment/alipay.png",
        description: "支付宝支付",
        status: 1,
        sort: 1,
      },
      {
        id: "wechat",
        name: "微信支付",
        icon: "/images/payment/wechat.png",
        description: "微信支付",
        status: 1,
        sort: 2,
      },
      {
        id: "unionpay",
        name: "银联支付",
        icon: "/images/payment/unionpay.png",
        description: "银联支付",
        status: 0,
        sort: 3,
      },
    ];
  }

  /**
   * 生成支付订单号
   */
  private generatePaymentSn(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `PAY${timestamp}${random}`;
  }

  /**
   * 生成退款单号
   */
  private generateRefundSn(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `REF${timestamp}${random}`;
  }

  /**
   * 生成支付信息
   */
  private async generatePaymentInfo(
    paymentMethod: PaymentMethod,
    paymentSn: string,
    amount: number,
    callbackUrl?: string,
  ) {
    switch (paymentMethod) {
      case PaymentMethod.ALIPAY:
        return {
          paymentUrl: `https://openapi.alipay.com/gateway.do?out_trade_no=${paymentSn}&total_amount=${amount}&callback_url=${callbackUrl}`,
          qrCode: `alipay://qr?_s=web-other&_t=${Date.now()}&qrcode=${encodeURIComponent(`https://openapi.alipay.com/gateway.do?out_trade_no=${paymentSn}&total_amount=${amount}`)}`,
        };
      case PaymentMethod.WECHAT:
        return {
          paymentUrl: `https://api.weixin.qq.com/pay/unifiedorder?out_trade_no=${paymentSn}&total_fee=${amount * 100}&notify_url=${callbackUrl}`,
          qrCode: `weixin://wxpay/bizpayurl?pr=${paymentSn}`,
        };
      default:
        return {};
    }
  }

  /**
   * 验证回调数据
   */
  private validateCallback(callbackData: any): boolean {
    // 这里应该根据支付平台的规则验证签名
    // 简化处理，实际项目中需要完整实现
    return callbackData && callbackData.transaction_id;
  }

  /**
   * 处理退款
   */
  private async processRefund(
    paymentMethod: PaymentMethod,
    refundSn: string,
    amount: number,
  ): Promise<any> {
    // 这里应该调用支付平台的退款接口
    // 简化处理，返回模拟结果
    return {
      success: true,
      refundId: refundSn,
      message: "退款申请已提交",
    };
  }
}
