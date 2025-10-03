// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PayService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取订单支付信息
   */
  async getOrderPaymentInfo(userId: number, orderId: number, clientType?: string) {
    // 获取订单详情
    const oid = Number(orderId);
    const uid = Number(userId);
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: oid,
        ...(uid ? { user_id: uid } : {}),
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

  // 获取可用支付方式（不包含余额）
  let paymentList = this.getAvailablePayment().filter((p) => p !== "balance");
    // 小程序端仅保留 wechat
    const ct = (clientType || "").toLowerCase();
    if (ct.includes("mini") || ct.includes("mp")) {
      paymentList = paymentList.filter((p) => p === "wechat");
    }

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

  const offlinePaymentList = [] as any[];
    if (paymentList.includes("offline")) {
      offlinePaymentList.push({
        offlinePayBank:
          "银行名称：中国银行\n账号：6222********1234\n开户行：中国银行XX支行",
        offlinePayCompany:
          "公司名称：XX科技有限公司\n账号：1234567890123456\n开户行：XX银行XX支行",
      });
    }

    return {
      order: {
        orderId: order.order_id,
        orderSn: order.order_sn,
        orderStatus: order.order_status,
        payStatus: order.pay_status,
        totalAmount: Number(order.total_amount || 0),
        paidAmount: Number(order.paid_amount || 0),
        unpaidAmount: Number(order.unpaid_amount || 0),
        shippingFee: Number(order.shipping_fee || 0),
        payTypeId: order.pay_type_id,
        addTime: this.formatUnixToTime(order.add_time),
      },
      paymentList: formattedPaymentList,
      offlinePaymentList: offlinePaymentList,
    };
  }

  /**
   * 获取支付日志
   */
  async getPayLogByOrderId(orderId: number) {
    const oid = Number(orderId);
    const log = await this.prisma.paylog.findFirst({
      where: { order_id: oid },
      orderBy: { add_time: "desc" },
    });
    return log ? this.mapPayLogCamel(log) : null;
  }

  /**
   * 根据订单ID获取支付状态
   */
  async getPayStatusByOrderId(orderId: number) {
    const oid = Number(orderId);
    const order = await this.prisma.order.findUnique({
      where: { order_id: oid },
      select: { pay_status: true },
    });

    return order?.pay_status || 0;
  }

  /**
   * 根据支付日志ID获取支付状态
   */
  async getPayStatusByPayLogId(payLogId: number) {
    const pid = Number(payLogId);
    const payLog = await this.prisma.paylog.findUnique({
      where: { paylog_id: pid },
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
    clientType?: string,
  ) {
    // 余额支付不在支付方式列表中，防御性拦截
    if (payType === "balance") {
      throw new HttpException("余额支付请在结算页处理，不作为支付方式返回", HttpStatus.BAD_REQUEST);
    }
    // 获取订单详情
    const oid = Number(orderId);
    const uid = Number(userId);
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: oid,
        ...(uid ? { user_id: uid } : {}),
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
      order_id: oid,
      order_sn: order.order_sn,
      order_amount: Number(order.total_amount ?? order.order_amount ?? 0),
      unpaid_amount: Number(order.unpaid_amount ?? (Number(order.total_amount ?? 0) - Number(order.paid_amount ?? 0))),
      pay_code: payType,
      user_id: uid,
      openid,
      order_type: 0,
    } as any;

    // 创建支付日志
  const payLogId = await this.createPayLog(payParams);
  (payParams as any).paylog_id = payLogId;

    // 调用第三方支付
    try {
  const payInfoRaw = await this.callThirdPartyPay(payParams, payType);

      // 统一输出给前端期望的数据结构
      let payInfo: any = {};
      const ct = (clientType || "").toLowerCase();
      switch (payType) {
        case "alipay":
          // H5 期望 html，App 期望 orderString
          if (ct === "h5" || ct.includes("web")) {
            // 若上游未返回 html，这里不再填充 mock，交由前端降级提示
            payInfo = payInfoRaw.html ? { html: payInfoRaw.html } : (payInfoRaw.orderString ? { html: payInfoRaw.orderString } : {});
          } else {
            payInfo = payInfoRaw.orderString ? { orderString: payInfoRaw.orderString } : {};
          }
          break;
        case "wechat":
        case "yabanpay_wechat":
        case "yunpay_wechat":
          // 小程序返回 JSAPI 所需参数；H5 返回 URL；其余平台保持兜底 URL
          if (ct.includes("mini") || ct.includes("mp")) {
            // 统一字段并保证 timeStamp 为字符串
            const ts = payInfoRaw.timeStamp ?? payInfoRaw.timestamp ?? Math.floor(Date.now() / 1000);
            payInfo = {
              appId: payInfoRaw.appId || payInfoRaw.appid || "",
              timeStamp: String(ts),
              nonceStr: payInfoRaw.nonceStr || payInfoRaw.noncestr || "",
              package: payInfoRaw.package || payInfoRaw.prepayId || "",
              signType: payInfoRaw.signType || "MD5",
              paySign: payInfoRaw.paySign || payInfoRaw.sign || "",
            };
          } else {
            // 对 H5 返回一个可唤起/跳转的 URL；若上游无返回，则以 weixin 协议兜底，避免 mock 域名
            const pr = (payParams as any).paylog_id || payParams.order_sn || Date.now();
            const fallback = `weixin://wxpay/bizpayurl?pr=${pr}`;
            payInfo = { url: payInfoRaw.url || fallback };
          }
          break;
        case "paypal":
        case "yabanpay_alipay":
          payInfo = payInfoRaw.url ? { url: payInfoRaw.url } : {};
          break;
        case "yunpay_alipay":
        case "yunpay_yunshanfu":
          payInfo = payInfoRaw.codeUrl ? { codeUrl: payInfoRaw.codeUrl } : (payInfoRaw.url ? { codeUrl: payInfoRaw.url } : {});
          break;
        default:
          payInfo = payInfoRaw;
      }

      return {
        orderId: oid,
        orderSn: order.order_sn,
        orderAmount: Number(payParams.unpaid_amount ?? 0),
        payInfo,
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
    // 去除 balance，避免在订单详情页显示并导致直接扣减
    return ["wechat", "alipay", "offline"];
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

  private mapPayLogCamel(log: any) {
    return {
      paylogId: log.paylog_id,
      paySn: log.pay_sn,
      payName: log.pay_name,
      orderId: log.order_id,
      orderSn: log.order_sn,
      orderAmount: Number(log.order_amount || 0),
      orderType: log.order_type,
      payAmount: Number(log.pay_amount || 0),
      payStatus: log.pay_status,
      payCode: log.pay_code,
      addTime: this.formatUnixToTime(log.add_time),
      transactionId: log.transaction_id,
      notifyData: log.notify_data,
      refundAmount: Number(log.refund_amount || 0),
      tokenCode: log.token_code,
      appid: log.appid,
    };
  }

  private formatUnixToTime(v: any): string {
    const ts = Number(v || 0);
    if (!ts) return "";
    const d = new Date(ts * 1000);
    const pad = (x: number) => String(x).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
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
    const payLog = await this.prisma.paylog.create({
      data: {
        order_id: params.order_id,
        order_sn: params.order_sn ?? "",
        order_amount: Number(params.order_amount ?? 0),
        order_type: 0,
        pay_amount: Number(params.unpaid_amount ?? 0),
        pay_status: 0,
        pay_code: params.pay_code,
        add_time: Math.floor(Date.now() / 1000),
        notify_data: "",
        token_code: "",
      },
    });

    return payLog.paylog_id;
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
          url: "https://mock.wechatpay.qr"
        };
      case "alipay":
        return { orderString: "mock_alipay_order_string", html: "<form>mock</form>" };
      case "balance":
        // 余额支付
        await this.processBalancePayment(params);
        return { success: true };
      case "yabanpay_wechat":
      case "yabanpay_alipay":
        return { url: "https://mock.yabanpay.redirect" };
      case "yunpay_wechat":
        return { url: "https://mock.yunpay.wechat" };
      case "yunpay_alipay":
      case "yunpay_yunshanfu":
        return { codeUrl: "https://mock.code.url" };
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

    const currentBalance = Number(user?.balance ?? 0);
    const unpaidAmount = Number(params.unpaid_amount ?? 0);

    if (!user || !Number.isFinite(currentBalance) || currentBalance < unpaidAmount) {
      throw new HttpException("余额不足", HttpStatus.BAD_REQUEST);
    }

    // 扣除余额
    await this.prisma.user.update({
      where: { user_id: params.user_id },
      data: {
        balance: (currentBalance - unpaidAmount) as any,
      },
    });

    // 更新订单支付状态
    await this.prisma.order.update({
      where: { order_id: params.order_id },
      data: {
        pay_status: 1,
        paid_amount: Number(params.unpaid_amount ?? 0) as any,
        unpaid_amount: 0 as any,
        pay_time: Math.floor(Date.now() / 1000),
      },
    });

    // 更新支付日志
    await this.prisma.paylog.update({
      where: { paylog_id: params.paylog_id },
      data: {
        pay_status: 1,
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
        paid_amount: (Number(data.total_fee) / 100) as any,
        unpaid_amount: 0 as any,
        pay_time: Math.floor(Date.now() / 1000),
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
