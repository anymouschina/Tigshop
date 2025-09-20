// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
  Delete,
  Put,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserOrderService } from "./user-order.service";
import {
  UserOrderQueryDto,
  CancelOrderDto,
  ConfirmReceiptDto,
} from "./dto/user-order.dto";

@ApiTags("用户端订单管理")
@Controller("user/order")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserOrderController {
  constructor(private readonly userOrderService: UserOrderService) {}

  @Get("list")
  @ApiOperation({ summary: "获取用户订单列表" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "order_status", required: false, description: "订单状态" })
  @ApiQuery({ name: "keyword", required: false, description: "搜索关键词" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async list(@Request() req, @Query() query: UserOrderQueryDto) {
    const userId = req.user.userId;
    return this.userOrderService.getOrderList(userId, query);
  }

  @Get("detail")
  @ApiOperation({ summary: "获取订单详情" })
  @ApiQuery({ name: "order_id", required: true, description: "订单ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async detail(@Request() req, @Query() query: { order_id: number }) {
    const userId = req.user.userId;
    const orderId = query.order_id;
    return this.userOrderService.getOrderDetail(userId, orderId);
  }

  @Get("orderNum")
  @ApiOperation({ summary: "获取订单数量统计" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async orderNum(@Request() req) {
    const userId = req.user.userId;
    return this.userOrderService.getOrderStatistics(userId);
  }

  @Post("cancelOrder")
  @ApiOperation({ summary: "取消订单" })
  @ApiResponse({ status: 200, description: "取消成功" })
  async cancelOrder(@Request() req, @Body() cancelDto: CancelOrderDto) {
    const userId = req.user.userId;
    return this.userOrderService.cancelOrder(userId, cancelDto);
  }

  @Post("delOrder")
  @ApiOperation({ summary: "删除订单" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteOrder(@Request() req, @Body() body: { order_id: number }) {
    const userId = req.user.userId;
    const orderId = body.order_id;
    return this.userOrderService.deleteOrder(userId, orderId);
  }

  @Post("confirmReceipt")
  @ApiOperation({ summary: "确认收货" })
  @ApiResponse({ status: 200, description: "确认成功" })
  async confirmReceipt(@Request() req, @Body() confirmDto: ConfirmReceiptDto) {
    const userId = req.user.userId;
    return this.userOrderService.confirmReceipt(userId, confirmDto);
  }

  @Get("shippingInfo")
  @ApiOperation({ summary: "获取物流信息" })
  @ApiQuery({ name: "order_id", required: true, description: "订单ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async shippingInfo(@Request() req, @Query() query: { order_id: number }) {
    const userId = req.user.userId;
    const orderId = query.order_id;
    return this.userOrderService.getShippingInfo(userId, orderId);
  }

  @Post("buyAgain")
  @ApiOperation({ summary: "再次购买" })
  @ApiResponse({ status: 200, description: "操作成功" })
  async buyAgain(@Request() req, @Body() body: { order_id: number }) {
    const userId = req.user.userId;
    const orderId = body.order_id;
    return this.userOrderService.buyAgain(userId, orderId);
  }
}
