// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PayService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取订单支付信息
   */
  async getOrderPaymentInfo(userId: number, orderId: number) {
    // 获取订单详情
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
      },
    });

    if (!order) {
      throw new HttpException("订单不存在", HttpStatus.NOT_FOUND);
    }

    // 检查订单是否可支付
    if (order.pay_status === 1) {
      throw new HttpException("订单已支付", HttpStatus.BAD_REQUEST);
    }

    if (order.order_status === 4) {
      throw new HttpException("订单已取消", HttpStatus.BAD_REQUEST);
    }

    // 获取可用支付方式
    let paymentList = this.getAvailablePayment();

    // 根据支付类型过滤
    if (order.pay_type_id === 1) {
      paymentList = paymentList.filter((p) => p !== "offline");
    } else if (order.pay_type_id === 3) {
      paymentList = paymentList.filter(
        (p) =>
          ![
            "wechat",
            "alipay",
            "paypal",
            "yabanpay_wechat",
            "yabanpay_alipay",
          ].includes(p),
      );
    }

    // 转换支付方式格式
    const formattedPaymentList = paymentList.map((p) =>
      p.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase()),
    );

    const offlinePaymentList = [];
    if (paymentList.includes("offline")) {
      offlinePaymentList.push({
        offline_pay_bank:
          "银行名称：中国银行\n账号：6222********1234\n开户行：中国银行XX支行",
        offline_pay_company:
          "公司名称：XX科技有限公司\n账号：1234567890123456\n开户行：XX银行XX支行",
      });
    }

    return {
      order: this.formatOrder(order),
      payment_list: formattedPaymentList,
      offline_payment_list: offlinePaymentList,
    };
  }

  /**
   * 获取支付日志
   */
  async getPayLogByOrderId(orderId: number) {
    return this.prisma.payLog.findFirst({
      where: { order_id: orderId },
      orderBy: { add_time: "desc" },
    });
  }

  /**
   * 根据订单ID获取支付状态
   */
  async getPayStatusByOrderId(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      select: { pay_status: true },
    });

    return order?.pay_status || 0;
  }

  /**
   * 根据支付日志ID获取支付状态
   */
  async getPayStatusByPayLogId(payLogId: number) {
    const payLog = await this.prisma.payLog.findUnique({
      where: { pay_log_id: payLogId },
      select: { pay_status: true },
    });

    return payLog?.pay_status || 0;
  }

  /**
   * 创建支付
   */
  async createPayment(
    userId: number,
    orderId: number,
    payType: string,
    code?: string,
  ) {
    // 获取订单详情
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
      },
    });

    if (!order) {
      throw new HttpException("订单不存在", HttpStatus.NOT_FOUND);
    }

    // 检查订单是否可支付
    if (order.pay_status === 1) {
      throw new HttpException("订单已支付", HttpStatus.BAD_REQUEST);
    }

    // 获取用户OpenID（微信支付需要）
    let openid = "";
    if (
      code &&
      ["wechat", "yabanpay_wechat", "yunpay_wechat"].includes(payType)
    ) {
      openid = await this.getWechatOpenId(code);
    }

    // 创建支付参数
    const payParams = {
      order_id: orderId,
      order_sn: order.order_sn,
      order_amount: order.order_amount,
      unpaid_amount: order.order_amount - (order.paid_amount || 0),
      pay_code: payType,
      user_id: userId,
      openid,
      order_type: 0,
    };

    // 创建支付日志
    const payLogId = await this.createPayLog(payParams);
    payParams.paylog_id = payLogId;

    // 调用第三方支付
    try {
      const payInfo = await this.callThirdPartyPay(payParams, payType);

      return {
        order_id: orderId,
        order_sn: order.order_sn,
        order_amount: payParams.unpaid_amount,
        pay_info: payInfo,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "支付失败",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 处理支付回调
   */
  async handleNotify(payCode: string, data: any) {
    try {
      let result;

      switch (payCode) {
        case "wechat":
          result = await this.handleWechatNotify(data);
          break;
        case "alipay":
          result = await this.handleAlipayNotify(data);
          break;
        case "paypal":
          result = await this.handlePaypalNotify(data);
          break;
        case "yabanpay":
        case "yunpay":
          result = await this.handleThirdPartyNotify(payCode, data);
          break;
        default:
          result = await this.handleWechatNotify(data);
      }

      return result;
    } catch (error) {
      return { code: "FAIL", message: "失败" };
    }
  }

  /**
   * 处理退款回调
   */
  async handleRefundNotify(payCode: string, data: any) {
    try {
      let result;

      switch (payCode) {
        case "wechat":
          result = await this.handleWechatRefundNotify(data);
          break;
        case "alipay":
          result = await this.handleAlipayRefundNotify(data);
          break;
        case "paypal":
          result = await this.handlePaypalRefundNotify(data);
          break;
        case "yabanpay":
        case "yunpay":
          result = await this.handleThirdPartyRefundNotify(payCode, data);
          break;
        default:
          result = await this.handleWechatRefundNotify(data);
      }

      return result;
    } catch (error) {
      return { code: "FAIL", message: "失败" };
    }
  }

  /**
   * 获取可用支付方式
   */
  private getAvailablePayment(): string[] {
    return ["wechat", "alipay", "balance", "offline"];
  }

  /**
   * 格式化订单数据
   */
  private formatOrder(order: any) {
    return {
      ...order,
      order_amount: Number(order.order_amount),
      paid_amount: Number(order.paid_amount || 0),
      shipping_fee: Number(order.shipping_fee || 0),
    };
  }

  /**
   * 获取微信OpenID
   */
  private async getWechatOpenId(code: string): Promise<string> {
    // 模拟获取微信OpenID
    return `mock_openid_${Date.now()}`;
  }

  /**
   * 创建支付日志
   */
  private async createPayLog(params: any): Promise<number> {
    const payLog = await this.prisma.payLog.create({
      data: {
        order_id: params.order_id,
        user_id: params.user_id,
        pay_code: params.pay_code,
        pay_name: this.getPayName(params.pay_code),
        pay_amount: params.unpaid_amount,
        pay_status: 0,
        add_time: new Date(),
      },
    });

    return payLog.pay_log_id;
  }

  /**
   * 获取支付方式名称
   */
  private getPayName(payCode: string): string {
    const payNames = {
      wechat: "微信支付",
      alipay: "支付宝",
      balance: "余额支付",
      offline: "线下支付",
    };

    return payNames[payCode] || "其他支付";
  }

  /**
   * 调用第三方支付
   */
  private async callThirdPartyPay(params: any, payType: string): Promise<any> {
    // 模拟第三方支付调用
    switch (payType) {
      case "wechat":
        return {
          appId: "mock_app_id",
          timeStamp: Math.floor(Date.now() / 1000),
          nonceStr: Math.random().toString(36).substr(2, 15),
          package: `prepay_id=${Date.now()}`,
          signType: "MD5",
          paySign: "mock_sign",
        };
      case "alipay":
        return {
          orderString: "mock_alipay_order_string",
        };
      case "balance":
        // 余额支付
        await this.processBalancePayment(params);
        return { success: true };
      default:
        throw new HttpException("不支持的支付方式", HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 处理余额支付
   */
  private async processBalancePayment(params: any) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: params.user_id },
    });

    if (!user || Number(user.user_money) < params.unpaid_amount) {
      throw new HttpException("余额不足", HttpStatus.BAD_REQUEST);
    }

    // 扣除余额
    await this.prisma.user.update({
      where: { user_id: params.user_id },
      data: {
        user_money: Number(user.user_money) - params.unpaid_amount,
      },
    });

    // 更新订单支付状态
    await this.prisma.order.update({
      where: { order_id: params.order_id },
      data: {
        pay_status: 1,
        paid_amount: params.unpaid_amount,
        pay_time: new Date(),
      },
    });

    // 更新支付日志
    await this.prisma.payLog.update({
      where: { pay_log_id: params.paylog_id },
      data: {
        pay_status: 1,
        pay_time: new Date(),
      },
    });
  }

  /**
   * 处理微信支付回调
   */
  private async handleWechatNotify(data: any): Promise<any> {
    // 模拟微信支付回调处理
    const orderId = parseInt(data.out_trade_no);

    await this.prisma.order.update({
      where: { order_id: orderId },
      data: {
        pay_status: 1,
        paid_amount: Number(data.total_fee) / 100,
        pay_time: new Date(),
      },
    });

    return { code: "SUCCESS", message: "OK" };
  }

  /**
   * 处理支付宝回调
   */
  private async handleAlipayNotify(data: any): Promise<any> {
    // 模拟支付宝回调处理
    const orderId = parseInt(data.out_trade_no);

    await this.prisma.order.update({
      where: { order_id: orderId },
      data: {
        pay_status: 1,
        paid_amount: Number(data.total_amount),
        pay_time: new Date(),
      },
    });

    return { code: "SUCCESS", message: "OK" };
  }

  /**
   * 处理PayPal回调
   */
  private async handlePaypalNotify(data: any): Promise<any> {
    // 模拟PayPal回调处理
    return { code: "SUCCESS", message: "OK" };
  }

  /**
   * 处理第三方支付回调
   */
  private async handleThirdPartyNotify(
    payCode: string,
    data: any,
  ): Promise<any> {
    // 模拟第三方支付回调处理
    return { code: "SUCCESS", message: "OK" };
  }

  /**
   * 处理微信退款回调
   */
  private async handleWechatRefundNotify(data: any): Promise<any> {
    // 模拟微信退款回调处理
    return { code: "SUCCESS", message: "OK" };
  }

  /**
   * 处理支付宝退款回调
   */
  private async handleAlipayRefundNotify(data: any): Promise<any> {
    // 模拟支付宝退款回调处理
    return { code: "SUCCESS", message: "OK" };
  }

  /**
   * 处理PayPal退款回调
   */
  private async handlePaypalRefundNotify(data: any): Promise<any> {
    // 模拟PayPal退款回调处理
    return { code: "SUCCESS", message: "OK" };
  }

  /**
   * 处理第三方退款回调
   */
  private async handleThirdPartyRefundNotify(
    payCode: string,
    data: any,
  ): Promise<any> {
    // 模拟第三方退款回调处理
    return { code: "SUCCESS", message: "OK" };
  }
}
