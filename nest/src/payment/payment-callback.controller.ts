// @ts-nocheck
import { Controller, Post, Body, Query, Headers, Param, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PayService } from "../order/pay.service";
import { Public } from "../auth/decorators/public.decorator";

/**
 * 支付回调（无需鉴权）
 * 对齐 PHP: /order/pay/notify?payCode=wechat
 * 以及退款回调: /order/pay/refundNotify?payCode=wechat
 * 
 * 注意：Nginx 需保证该路径不被缓存 & 允许 POST JSON
 */
@ApiTags("Payment Callback")
// 同时支持不带 /api 与带 /api 的两种前缀，避免 Nginx 前缀差异导致回调未命中
@Controller(["order/pay", "api/order/pay"])
export class PaymentCallbackController {
    private readonly logger = new Logger(PaymentCallbackController.name);
  constructor(private readonly payService: PayService) {}
  // 支持路径方式：/order/pay/notify/wechat  (避免微信不允许 notify_url 携带查询参数)
  @Post("notify/:payCode")
  @Public()
  @ApiOperation({ summary: "支付结果回调 (Path 版本)" })
  async notifyByPath(
    @Param("payCode") payCode: string = "wechat",
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    this.logger.warn(`[PaymentCallback] notifyByPath called with payCode=${payCode}`);
    const res = await this.payService.handleNotify(payCode || "wechat", body, headers);
    return res;
  }

  @Post("refundNotify")
  @Public()
  @ApiOperation({ summary: "退款结果回调 (WeChat/Alipay 等)" })
  async refundNotify(
    @Query("payCode") payCode: string = "wechat",
    @Body() body: any,
  ) {
    const res = await this.payService.handleRefundNotify(payCode || "wechat", body);
    return res;
  }
}