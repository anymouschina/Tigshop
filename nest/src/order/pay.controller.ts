// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PayService } from "./pay.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Order Payment")
@Controller("api")
export class PayController {
  constructor(private readonly payService: PayService) {}

  /**
   * 订单支付 - 对齐PHP版本 order/Pay/index
   */
  @Get("order/pay/index")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "订单支付" })
  async index(@Request() req, @Query() query: { id: number }) {
    const userId = Number(req.user?.userId || 0);
    const orderId = Number((query as any)?.id || 0);
    const clientType = String(req.headers["x-client-type"] || "");

    if (!orderId || isNaN(orderId)) {
      throw new HttpException("参数缺失", HttpStatus.BAD_REQUEST);
    }

    return this.payService.getOrderPaymentInfo(userId, orderId, clientType);
  }

  /**
   * 检测订单支付状态 - 对齐PHP版本 order/Pay/getPayLog
   */
  @Get("order/pay/getPayLog")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "检测订单支付状态" })
  async getPayLog(@Query() query: { id: number }) {
    const orderId = Number((query as any)?.id || 0);

    if (!orderId || isNaN(orderId)) {
      throw new HttpException("参数缺失", HttpStatus.BAD_REQUEST);
    }

    const payLog = await this.payService.getPayLogByOrderId(orderId);
    // PHP 返回 data 为 null，但前端期望余额支付场景回显 []
    // 这里对齐前端期望：若无记录，返回 []，否则返回对象
    return payLog ? payLog : [];
  }

  /**
   * 检测订单支付状态 - 对齐PHP版本 order/Pay/checkStatus
   */
  @Get("order/pay/checkStatus")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "检测订单支付状态" })
  async checkStatus(@Query() query: { id?: number; paylog_id?: number }) {
    const idNum = query?.id != null ? Number((query as any).id) : undefined;
    const paylogIdNum = query?.paylog_id != null ? Number((query as any).paylog_id) : undefined;

    if ((idNum == null || isNaN(idNum)) && (paylogIdNum == null || isNaN(paylogIdNum))) {
      throw new HttpException("参数缺失", HttpStatus.BAD_REQUEST);
    }

    let payStatus = 0;
    if (idNum != null && !isNaN(idNum)) {
      payStatus = await this.payService.getPayStatusByOrderId(idNum);
    } else {
      payStatus = await this.payService.getPayStatusByPayLogId(paylogIdNum as number);
    }

    return payStatus > 0 ? 1 : 0;
  }

  /**
   * 订单支付 - 对齐PHP版本 order/Pay/create
   */
  @Get("order/pay/create")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "创建支付" })
  async create(@Request() req, @Query() query: { id: number; type: string; code?: string }) {
    const userId = Number(req.user?.userId || 0);
    const id = Number((query as any)?.id || 0);
    const type = String((query as any)?.type || "");
    const code = (query as any)?.code;
    const clientType = String(req.headers["x-client-type"] || "");

    if (!id || isNaN(id) || !type) {
      throw new HttpException("未选择支付方式", HttpStatus.BAD_REQUEST);
    }

    return this.payService.createPayment(userId, Number(id), String(type), code, clientType);
  }

  /**
   * 支付回调 - 对齐PHP版本 order/Pay/notify
   */
  @Post("order/pay/notify")
  @Public()
  @ApiOperation({ summary: "支付回调" })
  async notify(@Body() body: any, @Query() query: { payCode?: string }, @Request() req: any) {
    const payCode = query.payCode || body.payCode;
    const headers = req?.headers || {};
    return this.payService.handleNotify(payCode, body, headers);
  }

  /**
   * 退款回调 - 对齐PHP版本 order/Pay/refundNotify
   */
  @Post("order/pay/refundNotify")
  @Public()
  @ApiOperation({ summary: "退款回调" })
  async refundNotify(@Body() body: any, @Query() query: { pay_code?: string }) {
    const payCode = query.pay_code || body.pay_code;
    return this.payService.handleRefundNotify(payCode, body);
  }
}
