import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

@Injectable()
export class AlipayService {
  private readonly logger = new Logger(AlipayService.name);
  private readonly appId: string;
  private readonly privateKey: string;
  private readonly alipayPublicKey: string;
  private readonly notifyUrl: string;
  private readonly returnUrl: string;
  private readonly gatewayUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('ALIPAY_APP_ID') || 'mock_app_id';
    this.privateKey = this.configService.get<string>('ALIPAY_PRIVATE_KEY') || 'mock_private_key';
    this.alipayPublicKey = this.configService.get<string>('ALIPAY_PUBLIC_KEY') || 'mock_public_key';
    this.notifyUrl = this.configService.get<string>('ALIPAY_NOTIFY_URL') || 'https://your-domain.com/api/payments/callback';
    this.returnUrl = this.configService.get<string>('ALIPAY_RETURN_URL') || 'https://your-domain.com/payment/return';
    this.gatewayUrl = this.configService.get<string>('ALIPAY_GATEWAY_URL') || 'https://openapi.alipay.com/gateway.do';
  }

  /**
   * 创建支付宝支付
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
      const bizContent = {
        out_trade_no: payment.paymentSn,
        total_amount: payment.amount.toFixed(2),
        subject: payment.description || '商品购买',
        body: payment.description || '商品购买',
        product_code: 'FAST_INSTANT_TRADE_PAY',
        time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟过期
      };

      const params = {
        app_id: this.appId,
        method: 'alipay.trade.page.pay',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        version: '1.0',
        notify_url: this.notifyUrl,
        return_url: this.returnUrl,
        biz_content: JSON.stringify(bizContent),
      };

      // 生成签名
      const sign = this.generateSign(params);

      // 构建支付URL
      const queryString = new URLSearchParams({
        ...params,
        sign,
      }).toString();

      const paymentUrl = `${this.gatewayUrl}?${queryString}`;

      // 模拟调用支付宝API
      const response = await this.callAlipayApi('alipay.trade.page.pay', bizContent);

      return {
        paymentSn: payment.paymentSn,
        amount: payment.amount,
        paymentUrl,
        qrCode: this.generateQrCode(paymentUrl),
        message: '支付宝支付创建成功',
      };
    } catch (error) {
      this.logger.error('创建支付宝支付失败:', error);
      throw new InternalServerErrorException('创建支付宝支付失败');
    }
  }

  /**
   * 创建当面付（扫码支付）
   * @param payment 支付信息
   * @returns 支付参数
   */
  async createQrPayment(payment: {
    paymentSn: string;
    amount: number;
    description: string;
    userId: number;
  }) {
    try {
      const bizContent = {
        out_trade_no: payment.paymentSn,
        total_amount: payment.amount.toFixed(2),
        subject: payment.description || '商品购买',
        timeout_express: '30m', // 30分钟过期
      };

      const params = {
        app_id: this.appId,
        method: 'alipay.trade.precreate',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        version: '1.0',
        notify_url: this.notifyUrl,
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.generateSign(params);

      const response = await this.callAlipayApi('alipay.trade.precreate', bizContent);

      if (response.code === '10000') {
        return {
          paymentSn: payment.paymentSn,
          amount: payment.amount,
          qrCode: response.qr_code,
          paymentUrl: response.qr_code,
          message: '支付宝扫码支付创建成功',
        };
      } else {
        throw new BadRequestException(`支付宝支付创建失败: ${response.msg} - ${response.sub_msg}`);
      }
    } catch (error) {
      this.logger.error('创建支付宝扫码支付失败:', error);
      throw new InternalServerErrorException('创建支付宝扫码支付失败');
    }
  }

  /**
   * 查询支付状态
   * @param paymentSn 支付单号
   * @returns 支付状态
   */
  async queryPayment(paymentSn: string) {
    try {
      const bizContent = {
        out_trade_no: paymentSn,
      };

      const params = {
        app_id: this.appId,
        method: 'alipay.trade.query',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.generateSign(params);

      const response = await this.callAlipayApi('alipay.trade.query', bizContent);

      if (response.code === '10000') {
        return {
          paymentSn,
          status: response.trade_status === 'TRADE_SUCCESS' ? 'PAID' : 'PENDING',
          transactionId: response.trade_no,
          amount: Number(response.total_amount),
          paidTime: response.send_pay_date,
          buyerId: response.buyer_id,
          rawResponse: response,
        };
      } else {
        throw new BadRequestException(`查询支付状态失败: ${response.msg} - ${response.sub_msg}`);
      }
    } catch (error) {
      this.logger.error('查询支付状态失败:', error);
      throw new InternalServerErrorException('查询支付状态失败');
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
      const bizContent = {
        out_trade_no: refundData.paymentSn,
        out_request_no: refundData.refundSn,
        refund_amount: refundData.amount.toFixed(2),
        refund_reason: refundData.reason || '用户申请退款',
      };

      const params = {
        app_id: this.appId,
        method: 'alipay.trade.refund',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.generateSign(params);

      const response = await this.callAlipayApi('alipay.trade.refund', bizContent);

      if (response.code === '10000') {
        return {
          refundSn: refundData.refundSn,
          paymentSn: refundData.paymentSn,
          refundId: response.out_request_no,
          status: 'PROCESSING',
          amount: Number(response.refund_fee),
          message: '退款申请成功',
        };
      } else {
        throw new BadRequestException(`申请退款失败: ${response.msg} - ${response.sub_msg}`);
      }
    } catch (error) {
      this.logger.error('申请退款失败:', error);
      throw new InternalServerErrorException('申请退款失败');
    }
  }

  /**
   * 查询退款状态
   * @param refundSn 退款单号
   * @returns 退款状态
   */
  async queryRefund(refundSn: string) {
    try {
      const bizContent = {
        out_request_no: refundSn,
        out_trade_no: '', // 需要额外逻辑获取原订单号
      };

      const params = {
        app_id: this.appId,
        method: 'alipay.trade.fastpay.refund.query',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.generateSign(params);

      const response = await this.callAlipayApi('alipay.trade.fastpay.refund.query', bizContent);

      if (response.code === '10000') {
        return {
          refundSn,
          status: this.mapRefundStatus(response.refund_status),
          refundId: response.out_request_no,
          amount: Number(response.refund_amount),
          refundTime: response.gmt_refund_pay,
          rawResponse: response,
        };
      } else {
        throw new BadRequestException(`查询退款状态失败: ${response.msg} - ${response.sub_msg}`);
      }
    } catch (error) {
      this.logger.error('查询退款状态失败:', error);
      throw new InternalServerErrorException('查询退款状态失败');
    }
  }

  /**
   * 关闭订单
   * @param paymentSn 支付单号
   * @returns 关闭结果
   */
  async closePayment(paymentSn: string) {
    try {
      const bizContent = {
        out_trade_no: paymentSn,
        operator_id: 'system',
      };

      const params = {
        app_id: this.appId,
        method: 'alipay.trade.close',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.generateSign(params);

      const response = await this.callAlipayApi('alipay.trade.close', bizContent);

      if (response.code === '10000') {
        return {
          paymentSn,
          status: 'CLOSED',
          message: '订单关闭成功',
        };
      } else {
        throw new BadRequestException(`关闭订单失败: ${response.msg} - ${response.sub_msg}`);
      }
    } catch (error) {
      this.logger.error('关闭订单失败:', error);
      throw new InternalServerErrorException('关闭订单失败');
    }
  }

  /**
   * 验证回调签名
   * @param callbackData 回调数据
   * @returns 验证结果
   */
  verifyCallback(callbackData: any): boolean {
    try {
      const { sign, sign_type, ...params } = callbackData;
      const generatedSign = this.generateSign(params);
      return sign === generatedSign;
    } catch (error) {
      this.logger.error('验证回调签名失败:', error);
      return false;
    }
  }

  /**
   * 生成签名
   */
  private generateSign(params: any): string {
    // 按字母顺序排序参数
    const sortedParams = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== '')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 构建待签名字符串
    const stringToSign = `${sortedParams}`;

    // 在实际项目中应该使用真实的RSA签名
    // 这里简化处理，实际项目中应该使用支付宝SDK
    return createHash('md5').update(stringToSign).digest('hex').toUpperCase();
  }

  /**
   * 调用支付宝API
   */
  private async callAlipayApi(method: string, bizContent: any): Promise<any> {
    // 模拟API调用，实际项目中应该使用真实的HTTP请求
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // 返回模拟数据
      if (method === 'alipay.trade.page.pay') {
        return {
          code: '10000',
          msg: 'Success',
          order_str: 'mock_order_string',
        };
      } else if (method === 'alipay.trade.precreate') {
        return {
          code: '10000',
          msg: 'Success',
          qr_code: `https://qr.alipay.com/bax${Math.random().toString(36).substr(2)}`,
          out_trade_no: bizContent.out_trade_no,
        };
      } else if (method === 'alipay.trade.query') {
        return {
          code: '10000',
          msg: 'Success',
          trade_no: `mock_alipay_trade_no_${Date.now()}`,
          out_trade_no: bizContent.out_trade_no,
          total_amount: bizContent.total_amount || '0.01',
          trade_status: 'TRADE_SUCCESS',
          send_pay_date: new Date().toISOString().replace('T', ' ').substr(0, 19),
          buyer_id: 'mock_buyer_id',
        };
      } else if (method === 'alipay.trade.refund') {
        return {
          code: '10000',
          msg: 'Success',
          out_trade_no: bizContent.out_trade_no,
          out_request_no: bizContent.out_request_no,
          refund_fee: bizContent.refund_amount,
        };
      } else if (method === 'alipay.trade.fastpay.refund.query') {
        return {
          code: '10000',
          msg: 'Success',
          out_request_no: bizContent.out_request_no,
          refund_status: 'REFUND_SUCCESS',
          refund_amount: '0.01',
          gmt_refund_pay: new Date().toISOString().replace('T', ' ').substr(0, 19),
        };
      } else if (method === 'alipay.trade.close') {
        return {
          code: '10000',
          msg: 'Success',
          out_trade_no: bizContent.out_trade_no,
        };
      }
    }

    // 实际环境中的真实API调用
    throw new InternalServerErrorException('支付宝API调用未实现');
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
      'REFUND_SUCCESS': 'COMPLETED',
      'REFUND_CLOSED': 'CANCELLED',
      'REFUND_PROCESSING': 'PROCESSING',
      'REFUND_FAILED': 'FAILED',
    };
    return statusMap[status] || 'FAILED';
  }
}