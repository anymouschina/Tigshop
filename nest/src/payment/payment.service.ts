import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePaymentDto, PaymentMethod, PaymentStatus } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { DatabaseService } from 'src/database/database.service';
import { OrderService } from 'src/order/order.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * 创建支付记录
   * @param createPaymentDto 支付创建数据
   * @returns 创建的支付记录
   */
  async create(createPaymentDto: CreatePaymentDto) {
    // 验证订单是否存在
    const order = await this.orderService.findOne(createPaymentDto.orderId);

    // 检查订单是否已支付
    if (order.payStatus === 'PAID') {
      throw new BadRequestException('订单已支付');
    }

    // 检查支付金额是否匹配
    if (Math.abs(createPaymentDto.amount - order.totalAmount) > 0.01) {
      throw new BadRequestException('支付金额与订单金额不匹配');
    }

    // 生成支付号
    const paymentSn = this.generatePaymentSn();

    // 创建支付记录
    const payment = await this.databaseService.payment.create({
      data: {
        paymentSn,
        orderId: createPaymentDto.orderId,
        userId: order.userId,
        amount: createPaymentDto.amount,
        paymentMethod: createPaymentDto.paymentMethod,
        status: PaymentStatus.PENDING,
        channelId: createPaymentDto.channelId,
        clientIp: createPaymentDto.clientIp,
        userAgent: createPaymentDto.userAgent,
        callbackUrl: createPaymentDto.callbackUrl,
        remark: createPaymentDto.remark,
      },
    });

    // 调用相应的支付网关
    const paymentResult = await this.processPayment(payment, createPaymentDto);

    return {
      payment,
      paymentResult,
    };
  }

  /**
   * 查询支付记录列表
   * @param queryDto 查询参数
   * @returns 支付记录列表和总数
   */
  async findAll(queryDto: PaymentQueryDto) {
    const {
      page = 1,
      size = 15,
      orderId,
      userId,
      paymentMethod,
      status,
      transactionId,
      channelOrderId,
      minAmount,
      maxAmount,
      startTime,
      endTime,
      isEnable,
    } = queryDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (status) {
      where.status = status;
    }

    if (transactionId) {
      where.transactionId = transactionId;
    }

    if (channelOrderId) {
      where.channelOrderId = channelOrderId;
    }

    if (minAmount !== undefined) {
      where.amount = { gte: minAmount };
    }

    if (maxAmount !== undefined) {
      where.amount = where.amount ? { ...where.amount, lte: maxAmount } : { lte: maxAmount };
    }

    if (startTime) {
      where.createdAt = { gte: new Date(startTime) };
    }

    if (endTime) {
      where.createdAt = where.createdAt ? { ...where.createdAt, lte: new Date(endTime) } : { lte: new Date(endTime) };
    }

    if (isEnable !== undefined) {
      where.isEnable = isEnable;
    }

    // 查询支付记录
    const [payments, total] = await Promise.all([
      this.databaseService.payment.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderId: true,
              orderSn: true,
              totalAmount: true,
              status: true,
            },
          },
          user: {
            select: {
              userId: true,
              username: true,
              nickname: true,
              email: true,
            },
          },
        },
      }),
      this.databaseService.payment.count({ where }),
    ]);

    return {
      payments,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 根据ID查询支付记录
   * @param paymentId 支付ID
   * @returns 支付记录详情
   */
  async findOne(paymentId: number) {
    const payment = await this.databaseService.payment.findUnique({
      where: { paymentId },
      include: {
        order: true,
        user: {
          select: {
            userId: true,
            username: true,
            nickname: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    return payment;
  }

  /**
   * 处理支付回调
   * @param paymentSn 支付号
   * @param callbackData 回调数据
   * @returns 处理结果
   */
  async handleCallback(paymentSn: string, callbackData: any) {
    const payment = await this.databaseService.payment.findUnique({
      where: { paymentSn },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    // 验证回调数据
    const isValid = await this.verifyCallback(payment, callbackData);
    if (!isValid) {
      throw new BadRequestException('回调数据验证失败');
    }

    // 更新支付状态
    const updatedPayment = await this.databaseService.payment.update({
      where: { paymentId: payment.paymentId },
      data: {
        status: PaymentStatus.SUCCESS,
        transactionId: callbackData.transaction_id,
        channelOrderId: callbackData.out_trade_no,
        paidAt: new Date(),
        callbackData: JSON.stringify(callbackData),
      },
    });

    // 更新订单状态
    await this.orderService.updateStatus(payment.orderId, {
      payStatus: 2, // PAID
      transactionId: callbackData.transaction_id,
      paidAmount: payment.amount,
    });

    return updatedPayment;
  }

  /**
   * 申请退款
   * @param paymentId 支付ID
   * @param refundAmount 退款金额
   * @param reason 退款原因
   * @returns 退款结果
   */
  async refund(paymentId: number, refundAmount: number, reason?: string) {
    const payment = await this.databaseService.payment.findUnique({
      where: { paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('只有支付成功的订单才能退款');
    }

    if (refundAmount > payment.amount) {
      throw new BadRequestException('退款金额不能超过支付金额');
    }

    // 生成退款号
    const refundSn = this.generateRefundSn();

    // 创建退款记录
    const refund = await this.databaseService.refund.create({
      data: {
        refundSn,
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: refundAmount,
        reason,
        status: 'processing',
      },
    });

    // 调用支付网关退款
    const refundResult = await this.processRefund(payment, refund, refundAmount);

    return {
      refund,
      refundResult,
    };
  }

  /**
   * 生成支付号
   * @returns 支付号
   */
  private generatePaymentSn(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
                   (date.getMonth() + 1).toString().padStart(2, '0') +
                   date.getDate().toString().padStart(2, '0');
    const timeStr = date.getHours().toString().padStart(2, '0') +
                   date.getMinutes().toString().padStart(2, '0') +
                   date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PAY${dateStr}${timeStr}${random}`;
  }

  /**
   * 生成退款号
   * @returns 退款号
   */
  private generateRefundSn(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
                   (date.getMonth() + 1).toString().padStart(2, '0') +
                   date.getDate().toString().padStart(2, '0');
    const timeStr = date.getHours().toString().padStart(2, '0') +
                   date.getMinutes().toString().padStart(2, '0') +
                   date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REF${dateStr}${timeStr}${random}`;
  }

  /**
   * 处理支付
   * @param payment 支付记录
   * @param paymentDto 支付数据
   * @returns 支付结果
   */
  private async processPayment(payment: any, paymentDto: CreatePaymentDto) {
    // 根据支付方式调用相应的支付网关
    switch (paymentDto.paymentMethod) {
      case PaymentMethod.ALIPAY:
        return this.processAlipayPayment(payment, paymentDto);
      case PaymentMethod.WECHAT:
        return this.processWechatPayment(payment, paymentDto);
      case PaymentMethod.CREDIT_CARD:
        return this.processCreditCardPayment(payment, paymentDto);
      case PaymentMethod.BANK_TRANSFER:
        return this.processBankTransferPayment(payment, paymentDto);
      case PaymentMethod.CASH:
        return this.processCashPayment(payment, paymentDto);
      default:
        throw new BadRequestException('不支持的支付方式');
    }
  }

  /**
   * 处理支付宝支付
   * @param payment 支付记录
   * @param paymentDto 支付数据
   * @returns 支付结果
   */
  private async processAlipayPayment(payment: any, paymentDto: CreatePaymentDto) {
    // 这里集成支付宝支付SDK
    // 返回支付表单或支付URL
    return {
      paymentMethod: 'alipay',
      paymentUrl: `https://openapi.alipay.com/gateway.do?out_trade_no=${payment.paymentSn}&total_amount=${payment.amount}&subject=订单支付`,
      qrCode: `https://qr.alipay.com/bax05915puxxxxxxxx`, // 示例二维码
    };
  }

  /**
   * 处理微信支付
   * @param payment 支付记录
   * @param paymentDto 支付数据
   * @returns 支付结果
   */
  private async processWechatPayment(payment: any, paymentDto: CreatePaymentDto) {
    // 这里集成微信支付SDK
    return {
      paymentMethod: 'wechat',
      codeUrl: 'weixin://wxpay/bizpayurl?pr=xxxxxxx', // 微信支付二维码链接
      prepayId: 'wx201410272009395522657a690389285100',
    };
  }

  /**
   * 处理信用卡支付
   * @param payment 支付记录
   * @param paymentDto 支付数据
   * @returns 支付结果
   */
  private async processCreditCardPayment(payment: any, paymentDto: CreatePaymentDto) {
    // 这里集成信用卡支付网关
    return {
      paymentMethod: 'credit_card',
      paymentForm: '信用卡支付表单',
    };
  }

  /**
   * 处理银行转账支付
   * @param payment 支付记录
   * @param paymentDto 支付数据
   * @returns 支付结果
   */
  private async processBankTransferPayment(payment: any, paymentDto: CreatePaymentDto) {
    return {
      paymentMethod: 'bank_transfer',
      bankInfo: {
        accountName: '公司名称',
        accountNumber: '1234567890123456',
        bankName: '开户银行',
        branchName: '支行名称',
      },
    };
  }

  /**
   * 处理现金支付
   * @param payment 支付记录
   * @param paymentDto 支付数据
   * @returns 支付结果
   */
  private async processCashPayment(payment: any, paymentDto: CreatePaymentDto) {
    // 现金支付直接标记为成功
    const updatedPayment = await this.databaseService.payment.update({
      where: { paymentId: payment.paymentId },
      data: {
        status: PaymentStatus.SUCCESS,
        transactionId: `CASH${Date.now()}`,
        paidAt: new Date(),
      },
    });

    // 更新订单状态
    await this.orderService.updateStatus(payment.orderId, {
      payStatus: 2, // PAID
      transactionId: updatedPayment.transactionId,
      paidAmount: payment.amount,
    });

    return {
      paymentMethod: 'cash',
      status: 'success',
    };
  }

  /**
   * 验证回调数据
   * @param payment 支付记录
   * @param callbackData 回调数据
   * @returns 验证结果
   */
  private async verifyCallback(payment: any, callbackData: any): Promise<boolean> {
    // 这里需要根据不同的支付方式实现相应的验签逻辑
    // 简化实现，实际项目中需要严格验证
    return callbackData.total_amount === payment.amount;
  }

  /**
   * 处理退款
   * @param payment 支付记录
   * @param refund 退款记录
   * @param refundAmount 退款金额
   * @returns 退款结果
   */
  private async processRefund(payment: any, refund: any, refundAmount: number) {
    // 这里需要根据不同的支付方式实现相应的退款逻辑
    // 简化实现
    return {
      refundId: refund.refundId,
      status: 'success',
      message: '退款申请已提交',
    };
  }
}