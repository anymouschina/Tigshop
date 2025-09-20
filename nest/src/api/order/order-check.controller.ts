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
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { OrderCheckService } from "./order-check.service";
import {
  OrderCheckDto,
  OrderUpdateDto,
  OrderSubmitDto,
} from "./dto/order-check.dto";

@ApiTags("用户端订单结算")
@Controller("order/check")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderCheckController {
  constructor(private readonly orderCheckService: OrderCheckService) {}

  @Get("index")
  @ApiOperation({ summary: "购物车结算" })
  @ApiResponse({ status: 200, description: "获取结算数据成功" })
  async index(@Request() req, @Query() query: { flow_type?: number }) {
    const userId = req.user.userId;
    const flowType = query.flow_type || 1;

    return this.orderCheckService.getOrderCheckData(userId, flowType);
  }

  @Post("update")
  @ApiOperation({ summary: "更新订单结算信息" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async update(@Request() req, @Body() updateDto: OrderUpdateDto) {
    const userId = req.user.userId;

    return this.orderCheckService.updateOrderCheck(userId, updateDto);
  }

  @Post("updateCoupon")
  @ApiOperation({ summary: "更新订单优惠券" })
  @ApiResponse({ status: 200, description: "更新优惠券成功" })
  async updateCoupon(@Request() req, @Body() body: { coupon_ids: number[] }) {
    const userId = req.user.userId;

    return this.orderCheckService.updateOrderCoupon(userId, body.coupon_ids);
  }

  @Post("submit")
  @ApiOperation({ summary: "提交订单" })
  @ApiResponse({ status: 200, description: "提交订单成功" })
  async submit(@Request() req, @Body() submitDto: OrderSubmitDto) {
    const userId = req.user.userId;

    return this.orderCheckService.submitOrder(userId, submitDto);
  }

  @Get("getInvoice")
  @ApiOperation({ summary: "获取上次订单发票信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getInvoice(@Request() req) {
    const userId = req.user.userId;

    return this.orderCheckService.getLastInvoice(userId);
  }

  @Get("getAvailablePaymentType")
  @ApiOperation({ summary: "获取可用支付方式" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAvailablePaymentType() {
    return this.orderCheckService.getAvailablePaymentType();
  }

  @Get("getStoreShippingType")
  @ApiOperation({ summary: "获取店铺配送方式" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStoreShippingType(
    @Request() req,
    @Query() query: { shop_id?: number },
  ) {
    const shopId = query.shop_id || 1;

    return this.orderCheckService.getStoreShippingType(shopId);
  }
}
