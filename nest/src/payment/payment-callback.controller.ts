// @ts-nocheck
import { Controller, Post, Body, Query, Headers } from "@nestjs/common";
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
@Controller("order/pay")
export class PaymentCallbackController {
  constructor(private readonly payService: PayService) {}

  @Post("notify")
  @Public()
  @ApiOperation({ summary: "支付结果回调 (WeChat/Alipay 等)" })
  async notify(
    @Query("payCode") payCode: string = "wechat",
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    // 透传 headers 供微信 v3 回调签名/解密（如果后续需要）
    const res = await this.payService.handleNotify(payCode || "wechat", body, headers);
    // 按微信 v3 规范返回 JSON {code:SUCCESS} 即可；其它渠道也接受
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