import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Order Management')
@Controller('api/orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 创建订单
   */
  @Post()
  @ApiOperation({ summary: '创建订单' })
  async createOrder(@Request() req, @Body() createOrderDto: any) {
    return this.orderService.createOrder(req.user.userId, createOrderDto);
  }

  /**
   * 获取订单列表
   */
  @Get()
  @ApiOperation({ summary: '获取订单列表' })
  async getOrderList(@Request() req, @Query() query: any) {
    return this.orderService.getOrderList(req.user.userId, query);
  }

  /**
   * 获取订单详情
   */
  @Get(':orderId')
  @ApiOperation({ summary: '获取订单详情' })
  async getOrderDetail(
    @Request() req,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getOrderDetail(Number(orderId), req.user.userId);
  }

  /**
   * 取消订单
   */
  @Put(':orderId/cancel')
  @ApiOperation({ summary: '取消订单' })
  async cancelOrder(
    @Request() req,
    @Param('orderId') orderId: string,
    @Body() { reason }: { reason?: string },
  ) {
    return this.orderService.cancelOrder(
      Number(orderId),
      req.user.userId,
      reason,
    );
  }

  /**
   * 确认收货
   */
  @Put(':orderId/confirm')
  @ApiOperation({ summary: '确认收货' })
  async confirmReceive(
    @Request() req,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.confirmReceive(
      Number(orderId),
      req.user.userId,
    );
  }

  /**
   * 删除订单
   */
  @Delete(':orderId')
  @ApiOperation({ summary: '删除订单' })
  async deleteOrder(
    @Request() req,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.deleteOrder(
      Number(orderId),
      req.user.userId,
    );
  }

  /**
   * 获取订单统计
   */
  @Get('stats/summary')
  @ApiOperation({ summary: '获取订单统计' })
  async getOrderStats(@Request() req) {
    return this.orderService.getOrderStats(req.user.userId);
  }
}