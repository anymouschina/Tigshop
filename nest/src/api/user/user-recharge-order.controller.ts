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
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserRechargeOrderService } from "./user-recharge-order.service";
import {
  RechargeOrderQueryDto,
  CreateRechargeOrderDto,
  RechargePayDto,
  CheckRechargeStatusDto,
} from "./dto/user-recharge-order.dto";

@ApiTags("用户充值订单")
@Controller("user/recharge-order")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserRechargeOrderController {
  constructor(
    private readonly userRechargeOrderService: UserRechargeOrderService,
  ) {}

  @Get()
  @ApiOperation({ summary: "获取充值记录列表" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({
    name: "status",
    required: false,
    description: "状态: 0-待支付,1-成功,2-失败",
  })
  @ApiQuery({ name: "keyword", required: false, description: "关键词搜索" })
  @ApiQuery({ name: "sort_field", required: false, description: "排序字段" })
  @ApiQuery({ name: "sort_order", required: false, description: "排序方向" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRechargeList(@Request() req, @Query() query: RechargeOrderQueryDto) {
    const userId = req.user.userId;
    return this.userRechargeOrderService.getRechargeList(userId, query);
  }

  @Post()
  @ApiOperation({ summary: "创建充值订单" })
  @ApiResponse({ status: 200, description: "创建成功" })
  async createRechargeOrder(
    @Request() req,
    @Body() body: CreateRechargeOrderDto,
  ) {
    const userId = req.user.userId;
    return this.userRechargeOrderService.createRechargeOrder(userId, body);
  }

  @Get("detail")
  @ApiOperation({ summary: "获取充值订单详情" })
  @ApiQuery({ name: "order_id", required: true, description: "订单ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRechargeOrder(@Request() req, @Query() query: { order_id: number }) {
    const userId = req.user.userId;
    return this.userRechargeOrderService.getRechargeOrder(
      query.order_id,
      userId,
    );
  }

  @Get("settings")
  @ApiOperation({ summary: "获取充值金额设置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRechargeSettings() {
    return this.userRechargeOrderService.getRechargeSettings();
  }

  @Get("payments")
  @ApiOperation({ summary: "获取可用支付方式" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAvailablePayments() {
    return this.userRechargeOrderService.getAvailablePayments();
  }

  @Post("pay")
  @ApiOperation({ summary: "充值支付" })
  @ApiResponse({ status: 200, description: "支付成功" })
  async processRechargePayment(@Request() req, @Body() body: RechargePayDto) {
    const userId = req.user.userId;
    return this.userRechargeOrderService.processRechargePayment(userId, body);
  }

  @Get("status")
  @ApiOperation({ summary: "检查充值状态" })
  @ApiQuery({ name: "order_id", required: true, description: "订单ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async checkRechargeStatus(
    @Request() req,
    @Query() query: CheckRechargeStatusDto,
  ) {
    const userId = req.user.userId;
    return this.userRechargeOrderService.checkRechargeStatus(
      query.order_id,
      userId,
    );
  }

  @Get("stats")
  @ApiOperation({ summary: "获取充值统计" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRechargeStats(@Request() req) {
    const userId = req.user.userId;
    return this.userRechargeOrderService.getRechargeStats(userId);
  }

  @Post("callback")
  @ApiOperation({ summary: "支付回调处理" })
  @ApiQuery({ name: "pay_log_id", required: true, description: "支付日志ID" })
  @ApiResponse({ status: 200, description: "处理成功" })
  async handlePaymentCallback(
    @Query() query: { pay_log_id: number },
    @Body() paymentData: any,
  ) {
    return this.userRechargeOrderService.handlePaymentCallback(
      query.pay_log_id,
      paymentData,
    );
  }
}
