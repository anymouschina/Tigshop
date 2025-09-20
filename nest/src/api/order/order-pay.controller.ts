// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { OrderPayService } from "./order-pay.service";

@ApiTags("用户端订单支付")
@Controller("order/pay")
export class OrderPayController {
  constructor(private readonly orderPayService: OrderPayService) {}

  @Get("index")
  @ApiOperation({ summary: "支付页信息" })
  @ApiResponse({ status: 200, description: "获取支付信息成功" })
  async index(@Request() req, @Query() query: { order_id: number }) {
    const userId = req.user.userId;
    const orderId = query.order_id;

    return this.orderPayService.getPaymentInfo(userId, orderId);
  }

  @Get("checkStatus")
  @ApiOperation({ summary: "检查订单支付状态" })
  @ApiResponse({ status: 200, description: "检查成功" })
  async checkStatus(@Request() req, @Query() query: { order_id: number }) {
    const userId = req.user.userId;
    const orderId = query.order_id;

    return this.orderPayService.checkPaymentStatus(userId, orderId);
  }

  @Get("getPayLog")
  @ApiOperation({ summary: "获取支付日志" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getPayLog(@Request() req, @Query() query: { order_id: number }) {
    const userId = req.user.userId;
    const orderId = query.order_id;

    return this.orderPayService.getPaymentLog(userId, orderId);
  }

  @Get("create")
  @ApiOperation({ summary: "创建支付" })
  @ApiResponse({ status: 200, description: "创建支付成功" })
  async create(
    @Request() req,
    @Query() query: { order_id: number; pay_type: string },
  ) {
    const userId = req.user.userId;
    const orderId = query.order_id;
    const payType = query.pay_type;

    return this.orderPayService.createPayment(userId, orderId, payType);
  }

  @Post("notify")
  @ApiOperation({ summary: "支付回调" })
  @ApiResponse({ status: 200, description: "处理成功" })
  async notify(@Body() body: any) {
    // 支付回调接口，无需登录验证
    return this.orderPayService.handlePaymentNotify(body);
  }

  @Post("refundNotify")
  @ApiOperation({ summary: "退款回调" })
  @ApiResponse({ status: 200, description: "处理成功" })
  async refundNotify(@Body() body: any) {
    // 退款回调接口，无需登录验证
    return this.orderPayService.handleRefundNotify(body);
  }
}
