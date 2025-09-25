// @ts-nocheck
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac } from "crypto";

@Injectable()
export class WechatPayService {
  private readonly logger = new Logger(WechatPayService.name);
  private readonly appId: string;
  private readonly mchId: string;
  private readonly apiKey: string;
  private readonly notifyUrl: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.appId =
      this.configService.get<string>("WECHAT_APP_ID") || "mock_app_id";
    this.mchId =
      this.configService.get<string>("WECHAT_MCH_ID") || "mock_mch_id";
    this.apiKey =
      this.configService.get<string>("WECHAT_API_KEY") || "mock_api_key";
    this.notifyUrl =
      this.configService.get<string>("WECHAT_NOTIFY_URL") ||
      "https://your-domain.com/api/payments/callback";
    this.baseUrl =
      this.configService.get<string>("WECHAT_BASE_URL") ||
      "https://api.mch.weixin.qq.com";
  }

  /**
   * 创建微信支付
   * @param payment 支付信息
   * @returns 支付参数
   */
  async createPayment(payment: {
    paymentSn: string;
    amount: number;
    description: string;
    userId: number;
  }) {
    try {
      const order = {
        appid: this.appId,
        mch_id: this.mchId,
        nonce_str: this.generateNonceStr(),
        body: payment.description || "商品购买",
        out_trade_no: payment.paymentSn,
        total_fee: Math.round(payment.amount * 100), // 转换为分
        spbill_create_ip: "127.0.0.1",
        notify_url: this.notifyUrl,
        trade_type: "NATIVE", // 扫码支付
        product_id: payment.paymentSn,
      };

      // 生成签名
      const sign = this.generateSign(order);

      // 构建XML
      const xml = this.buildXml({ ...order, sign });

      // 模拟调用微信支付API
      const response = await this.callWechatPayApi("/pay/unifiedorder", xml);

      // 解析响应
      const result = this.parseXmlResponse(response);

      if (
        result.return_code === "SUCCESS" &&
        result.result_code === "SUCCESS"
      ) {
        return {
          paymentSn: payment.paymentSn,
          amount: payment.amount,
          paymentUrl: result.code_url,
          qrCode: this.generateQrCode(result.code_url),
          prepayId: result.prepay_id,
          message: "微信支付创建成功",
        };
      } else {
        throw new BadRequestException(
          `微信支付创建失败: ${result.return_msg || result.err_code_des}`,
        );
      }
    } catch (error) {
      this.logger.debug("创建微信支付失败:", error);
      throw new InternalServerErrorException("创建微信支付失败");
    }
  }

  /**
   * 查询支付状态
   * @param paymentSn 支付单号
   * @returns 支付状态
   */
  async queryPayment(paymentSn: string) {
    try {
      const order = {
        appid: this.appId,
        mch_id: this.mchId,
        out_trade_no: paymentSn,
        nonce_str: this.generateNonceStr(),
      };

      const sign = this.generateSign(order);
      const xml = this.buildXml({ ...order, sign });

      const response = await this.callWechatPayApi("/pay/orderquery", xml);
      const result = this.parseXmlResponse(response);

      if (result.return_code === "SUCCESS") {
        return {
          paymentSn,
          status: result.trade_state === "SUCCESS" ? "PAID" : "PENDING",
          transactionId: result.transaction_id,
          amount: Number(result.total_fee) / 100,
          paidTime: result.time_end,
          rawResponse: result,
        };
      } else {
        throw new BadRequestException(`查询支付状态失败: ${result.return_msg}`);
      }
    } catch (error) {
      this.logger.debug("查询支付状态失败:", error);
      throw new InternalServerErrorException("查询支付状态失败");
    }
  }

  /**
   * 申请退款
   * @param refundData 退款数据
   * @returns 退款结果
   */
  async createRefund(refundData: {
    refundSn: string;
    paymentSn: string;
    amount: number;
    reason?: string;
  }) {
    try {
      const order = {
        appid: this.appId,
        mch_id: this.mchId,
        nonce_str: this.generateNonceStr(),
        out_trade_no: refundData.paymentSn,
        out_refund_no: refundData.refundSn,
        total_fee: Math.round(refundData.amount * 100),
        refund_fee: Math.round(refundData.amount * 100),
        refund_desc: refundData.reason || "用户申请退款",
      };

      const sign = this.generateSign(order);
      const xml = this.buildXml({ ...order, sign });

      const response = await this.callWechatPayApi(
        "/secapi/pay/refund",
        xml,
        true,
      );
      const result = this.parseXmlResponse(response);

      if (
        result.return_code === "SUCCESS" &&
        result.result_code === "SUCCESS"
      ) {
        return {
          refundSn: refundData.refundSn,
          paymentSn: refundData.paymentSn,
          refundId: result.refund_id,
          status: "PROCESSING",
          message: "退款申请成功",
        };
      } else {
        throw new BadRequestException(
          `申请退款失败: ${result.return_msg || result.err_code_des}`,
        );
      }
    } catch (error) {
      this.logger.debug("申请退款失败:", error);
      throw new InternalServerErrorException("申请退款失败");
    }
  }

  /**
   * 查询退款状态
   * @param refundSn 退款单号
   * @returns 退款状态
   */
  async queryRefund(refundSn: string) {
    try {
      const order = {
        appid: this.appId,
        mch_id: this.mchId,
        nonce_str: this.generateNonceStr(),
        out_refund_no: refundSn,
      };

      const sign = this.generateSign(order);
      const xml = this.buildXml({ ...order, sign });

      const response = await this.callWechatPayApi("/pay/refundquery", xml);
      const result = this.parseXmlResponse(response);

      if (result.return_code === "SUCCESS") {
        return {
          refundSn,
          status: this.mapRefundStatus(result.refund_status_0),
          refundId: result.refund_id_0,
          amount: Number(result.refund_fee_0) / 100,
          successTime: result.refund_success_time_0,
          rawResponse: result,
        };
      } else {
        throw new BadRequestException(`查询退款状态失败: ${result.return_msg}`);
      }
    } catch (error) {
      this.logger.debug("查询退款状态失败:", error);
      throw new InternalServerErrorException("查询退款状态失败");
    }
  }

  /**
   * 验证回调签名
   * @param callbackData 回调数据
   * @returns 验证结果
   */
  verifyCallback(callbackData: any): boolean {
    try {
      const { sign, ...params } = callbackData;
      const generatedSign = this.generateSign(params);
      return sign === generatedSign;
    } catch (error) {
      this.logger.debug("验证回调签名失败:", error);
      return false;
    }
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  /**
   * 生成签名
   */
  private generateSign(params: any): string {
    const sortedParams = Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== "")
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    const stringSignTemp = `${sortedParams}&key=${this.apiKey}`;
    return createHash("md5")
      .update(stringSignTemp, "utf8")
      .digest("hex")
      .toUpperCase();
  }

  /**
   * 构建XML
   */
  private buildXml(params: any): string {
    const xmlContent = Object.keys(params)
      .map((key) => `<${key}><![CDATA[${params[key]}]]></${key}>`)
      .join("");

    return `<xml>${xmlContent}</xml>`;
  }

  /**
   * 解析XML响应
   */
  private parseXmlResponse(xml: string): any {
    // 简化的XML解析，实际项目中应该使用专业的XML解析库
    const result: any = {};
    const regex = /<([^>]+)><!\[CDATA\[([^\]]+)\]\]><\/\1>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      result[match[1]] = match[2];
    }

    return result;
  }

  /**
   * 调用微信支付API
   */
  private async callWechatPayApi(
    path: string,
    xml: string,
    useCert = false,
  ): Promise<string> {
    // 模拟API调用，实际项目中应该使用真实的HTTP请求
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      // 返回模拟数据
      if (path === "/pay/unifiedorder") {
        return `<xml>
          <return_code><![CDATA[SUCCESS]]></return_code>
          <return_msg><![CDATA[OK]]></return_msg>
          <appid><![CDATA[${this.appId}]]></appid>
          <mch_id><![CDATA[${this.mchId}]]></mch_id>
          <nonce_str><![CDATA[${this.generateNonceStr()}]]></nonce_str>
          <sign><![CDATA[MOCK_SIGN]]></sign>
          <result_code><![CDATA[SUCCESS]]></result_code>
          <prepay_id><![CDATA[mock_prepay_id_${Date.now()}]]></prepay_id>
          <trade_type><![CDATA[NATIVE]]></trade_type>
          <code_url><![CDATA[weixin://wxpay/bizpayurl?pr=${Math.random().toString(36).substr(2)}]]></code_url>
        </xml>`;
      } else if (path === "/pay/orderquery") {
        return `<xml>
          <return_code><![CDATA[SUCCESS]]></return_code>
          <return_msg><![CDATA[OK]]></return_msg>
          <appid><![CDATA[${this.appId}]]></appid>
          <mch_id><![CDATA[${this.mchId}]]></mch_id>
          <nonce_str><![CDATA[${this.generateNonceStr()}]]></nonce_str>
          <sign><![CDATA[MOCK_SIGN]]></sign>
          <out_trade_no><![CDATA[${xml.match(/out_trade_no><!\[CDATA\[([^\]]+)\]\]/)?.[1] || ""}]]></out_trade_no>
          <trade_state><![CDATA[SUCCESS]]></trade_state>
          <transaction_id><![CDATA[mock_transaction_id_${Date.now()}]]></transaction_id>
          <time_end><![CDATA[${new Date()
            .toISOString()
            .replace(/[-:T.]/g, "")
            .substr(0, 14)}]]></time_end>
          <total_fee><![CDATA[${xml.match(/total_fee><!\[CDATA\[([^\]]+)\]\]/)?.[1] || "0"}]]></total_fee>
        </xml>`;
      } else if (path === "/secapi/pay/refund") {
        return `<xml>
          <return_code><![CDATA[SUCCESS]]></return_code>
          <return_msg><![CDATA[OK]]></return_msg>
          <appid><![CDATA[${this.appId}]]></appid>
          <mch_id><![CDATA[${this.mchId}]]></mch_id>
          <nonce_str><![CDATA[${this.generateNonceStr()}]]></nonce_str>
          <sign><![CDATA[MOCK_SIGN]]></sign>
          <result_code><![CDATA[SUCCESS]]></result_code>
          <refund_id><![CDATA[mock_refund_id_${Date.now()}]]></refund_id>
        </xml>`;
      } else if (path === "/pay/refundquery") {
        return `<xml>
          <return_code><![CDATA[SUCCESS]]></return_code>
          <return_msg><![CDATA[OK]]></return_msg>
          <appid><![CDATA[${this.appId}]]></appid>
          <mch_id><![CDATA[${this.mchId}]]></mch_id>
          <nonce_str><![CDATA[${this.generateNonceStr()}]]></nonce_str>
          <sign><![CDATA[MOCK_SIGN]]></sign>
          <out_refund_no><![CDATA[${xml.match(/out_refund_no><!\[CDATA\[([^\]]+)\]\]/)?.[1] || ""}]]></out_refund_no>
          <refund_status_0><![CDATA[SUCCESS]]></refund_status_0>
          <refund_id_0><![CDATA[mock_refund_id_${Date.now()}]]></refund_id_0>
          <refund_fee_0><![CDATA[${xml.match(/refund_fee><!\[CDATA\[([^\]]+)\]\]/)?.[1] || "0"}]]></refund_fee_0>
          <refund_success_time_0><![CDATA[${new Date()
            .toISOString()
            .replace(/[-:T.]/g, "")
            .substr(0, 14)}]]></refund_success_time_0>
        </xml>`;
      }
    }

    // 实际环境中的真实API调用
    // 这里应该使用实际的HTTP请求库如axios来调用微信支付API
    throw new InternalServerErrorException("微信支付API调用未实现");
  }

  /**
   * 生成二维码（模拟）
   */
  private generateQrCode(url: string): string {
    // 实际项目中应该使用专业的二维码生成库
    return `data:image/png;base64,mock_qr_code_for_${encodeURIComponent(url)}`;
  }

  /**
   * 映射退款状态
   */
  private mapRefundStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      SUCCESS: "COMPLETED",
      REFUNDCLOSE: "CANCELLED",
      PROCESSING: "PROCESSING",
      CHANGE: "FAILED",
    };
    return statusMap[status] || "FAILED";
  }
}
