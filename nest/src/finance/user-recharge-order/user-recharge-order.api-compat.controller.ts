// @ts-nocheck
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserRechargeOrderService } from "./user-recharge-order.service";
import { RechargeSettingService } from "src/promotion/recharge-setting/rechargeSetting.service";
import { ConfigService as SettingConfigService } from "src/setting/config.service";

@ApiTags("User API - 充值订单 兼容")
@Controller("api/user/rechargeOrder")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserRechargeOrderApiCompatController {
  constructor(
    private readonly service: UserRechargeOrderService,
    private readonly rechargeSettingService: RechargeSettingService,
    private readonly settingConfig: SettingConfigService,
  ) {}

  // GET /api/user/rechargeOrder/list
  @Get("list")
  @ApiOperation({ summary: "充值记录列表（兼容）" })
  async list(@Request() req, @Query("page") page?: any) {
    const userId = req.user.userId;
    const result = await this.service.getUserRechargeHistory(userId, {
      page: Number(page || 1),
      size: 15,
      sortField: "add_time",
      sortOrder: "desc",
    } as any);
    return {
      code: 0,
      message: "success",
      data: {
        records: result.records,
        total: result.total,
      },
    };
  }

  // POST /api/user/rechargeOrder/update  充值申请（创建或更新金额）
  @Post("update")
  @ApiOperation({ summary: "充值申请（兼容）" })
  async update(@Request() req, @Body() body: any) {
    const userId = req.user.userId;
    const id = Number(body.id || 0);
    const amount = Number(body.amount || body.money || 0);
    const orderId = await this.service.rechargeOperation(id, amount, userId);
    return { code: 0, message: "success", data: { order_id: orderId } };
  }

  // GET /api/user/rechargeOrder/setting  充值金额列表
  @Get("setting")
  @ApiOperation({ summary: "充值金额列表（兼容）" })
  async setting() {
    const list = await this.rechargeSettingService.findAll({
      page: 1,
      size: 9999,
      sortField: "sort_order",
      sortOrder: "asc",
      status: 1,
    } as any);
    return { code: 0, message: "success", data: list.records };
  }

  // GET /api/user/rechargeOrder/paymentList  充值支付方式列表
  @Get("paymentList")
  @ApiOperation({ summary: "充值支付方式列表（兼容）" })
  async paymentList() {
    // 基础列表，后续根据配置开关过滤
    let paymentList = [
      "wechat",
      "alipay",
      "paypal",
    ];
    // 读取支付宝、线下支付的开关
    try {
      const [aliCfg, offlineCfg] = await Promise.all([
        this.settingConfig.getJsonConfig("aliPaySettings"),
        this.settingConfig.getJsonConfig("offlinePaySettings"),
      ]);
      const ali = aliCfg || {};
      const useAlipay = ali.useAlipay;
      const aliEnabled = useAlipay === 1 || useAlipay === true || useAlipay === "1";
      if (!aliEnabled) {
        paymentList = paymentList.filter((p) => p !== "alipay");
      }
      const off = offlineCfg || {};
      const flag = off?.isOpen ?? off?.open ?? off?.enabled ?? off?.enable ?? off?.status ?? off?.useOffline ?? off?.useOfflinePay;
      const offlineEnabled = flag === 1 || flag === true || flag === "1";
      if (!offlineEnabled) {
        paymentList = paymentList.filter((p) => p !== "offline");
      }
    } catch {}
    return { code: 0, message: "success", data: paymentList };
  }

  // POST /api/user/rechargeOrder/pay  返回订单与可支付方式（过滤线下）
  @Post("pay")
  @ApiOperation({ summary: "充值支付信息（兼容）" })
  async pay(@Body("order_id") orderId: any) {
    const id = Number(orderId || 0);
    const order = await this.service.findById(id);
    if (order.status === true) {
      return { code: 1, message: "订单已支付", data: null };
    }
    let paymentList = ["wechat", "alipay", "paypal"]; // 过滤线下
    try {
      const aliCfg = await this.settingConfig.getJsonConfig("aliPaySettings");
      const useAlipay = (aliCfg || {}).useAlipay;
      const aliEnabled = useAlipay === 1 || useAlipay === true || useAlipay === "1";
      if (!aliEnabled) {
        paymentList = paymentList.filter((p) => p !== "alipay");
      }
    } catch {}
    return { code: 0, message: "success", data: { order, payment_list: paymentList } };
  }

  // POST /api/user/rechargeOrder/create  创建充值支付
  @Post("create")
  @ApiOperation({ summary: "创建充值支付（兼容）" })
  async create(@Request() req, @Body() body: any) {
    const userId = req.user.userId;
    const id = Number(body.id || 0);
    const type = String(body.type || "");
    const code = body.code as string | undefined;
    if (!type) return { code: 1, message: "未选择支付方式", data: null };
    const res = await this.service.createRechargePayment({ orderId: id, payType: type, userId, code });
    if ((res as any).error) {
      return { code: 1, message: (res as any).message || "创建支付失败", data: null };
    }
    return {
      code: 0,
      message: "success",
      data: {
        order_id: res.order_id,
        order_amount: res.order_amount,
        pay_info: res.pay_info,
      },
    };
  }

  // GET /api/user/rechargeOrder/checkStatus  获取充值支付状态
  @Get("checkStatus")
  @ApiOperation({ summary: "获取充值支付状态（兼容）" })
  async checkStatus(@Query("id") id: any) {
    const order = await this.service.findById(Number(id || 0));
    return { code: 0, message: "success", data: order.status === true ? 1 : 0 };
  }
}
