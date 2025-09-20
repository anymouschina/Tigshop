import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import {
  AdminOrderQueryDto,
  AdminOrderDetailDto,
  UpdateOrderStatusDto,
  UpdateOrderShippingDto,
  UpdateOrderPaymentDto,
  BatchOrderOperationDto
} from './dto/admin-order.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('订单管理')
@Controller('admin/order')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: '获取订单列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词（订单号/收货人/手机号）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'order_status', required: false, description: '订单状态' })
  @ApiQuery({ name: 'pay_status', required: false, description: '支付状态' })
  @ApiQuery({ name: 'shipping_status', required: false, description: '配送状态' })
  @ApiQuery({ name: 'order_type', required: false, description: '订单类型' })
  @ApiQuery({ name: 'time_type', required: false, description: '时间类型' })
  @ApiQuery({ name: 'start_time', required: false, description: '开始时间' })
  @ApiQuery({ name: 'end_time', required: false, description: '结束时间' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOrderList(@Query() query: AdminOrderQueryDto) {
    const filter = {
      ...query,
      shop_id: 1, // TODO: 从token中获取
    };

    const [records, total] = await Promise.all([
      this.orderService.getAdminOrderList(filter),
      this.orderService.getAdminOrderCount(filter)
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
      }
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取订单统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOrderStatistics() {
    const statistics = await this.orderService.getOrderStatistics();
    return {
      code: 200,
      message: '获取成功',
      data: statistics,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOrderDetail(@Param('id') id: number) {
    const order = await this.orderService.getAdminOrderDetail(id);
    return {
      code: 200,
      message: '获取成功',
      data: order,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新订单状态' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateOrderStatus(
    @Param('id') id: number,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const result = await this.orderService.updateOrderStatus(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put(':id/shipping')
  @ApiOperation({ summary: '更新配送信息' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateOrderShipping(
    @Param('id') id: number,
    @Body() updateDto: UpdateOrderShippingDto,
  ) {
    const result = await this.orderService.updateOrderShipping(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put(':id/payment')
  @ApiOperation({ summary: '更新支付信息' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateOrderPayment(
    @Param('id') id: number,
    @Body() updateDto: UpdateOrderPaymentDto,
  ) {
    const result = await this.orderService.updateOrderPayment(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put(':id/amount')
  @ApiOperation({ summary: '调整订单金额' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '调整成功' })
  async adjustOrderAmount(
    @Param('id') id: number,
    @Body() adjustDto: { adjust_amount: number; adjust_reason: string },
  ) {
    const result = await this.orderService.adjustOrderAmount(id, adjustDto);
    return {
      code: 200,
      message: '调整成功',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除订单' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteOrder(@Param('id') id: number) {
    await this.orderService.deleteAdminOrder(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  @Post('batch')
  @ApiOperation({ summary: '批量操作订单' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async batchOperation(@Body() batchDto: BatchOrderOperationDto) {
    const result = await this.orderService.batchOperation(batchDto);
    return {
      code: 200,
      message: '操作成功',
      data: result,
    };
  }

  @Post('export')
  @ApiOperation({ summary: '导出订单' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportOrders(@Body() exportDto: any) {
    const result = await this.orderService.exportOrders(exportDto);
    return {
      code: 200,
      message: '导出成功',
      data: result,
    };
  }

  @Get('config')
  @ApiOperation({ summary: '获取订单配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOrderConfig() {
    const config = await this.orderService.getOrderConfig();
    return {
      code: 200,
      message: '获取成功',
      data: config,
    };
  }

  @Put('config')
  @ApiOperation({ summary: '更新订单配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateOrderConfig(@Body() config: any) {
    const result = await this.orderService.updateOrderConfig(config);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }
}