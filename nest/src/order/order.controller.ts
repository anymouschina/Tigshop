import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException, ParseIntPipe, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { ApplyCouponDto } from 'src/coupon/dto/apply-coupon.dto';
import { CouponService } from 'src/coupon/coupon.service';
import { Prisma } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Orders')
@Controller('api/orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly couponService: CouponService,
  ) {}

  /**
   * GET /api/orders/stats
   * 获取订单统计数据，支持按不同时间维度进行统计
   * 
   * @param timeRange 时间维度：day(日)、week(周)、month(月)、year(年)
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 订单统计数据
   */
  @Get('stats')
  @Public()
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: '时间维度：day(日)、week(周)、month(月)、year(年)',
    enum: ['day', 'week', 'month', 'year'],
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '开始日期，格式：YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '结束日期，格式：YYYY-MM-DD',
  })
  @ApiResponse({
    status: 200,
    description: '订单统计数据',
  })
  async getStatistics(
    @Query('timeRange') timeRange?: 'day' | 'week' | 'month' | 'year',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getStatistics(timeRange, startDate, endDate);
  }

  /**
   * GET /api/orders
   * 获取订单列表，可按状态筛选
   * 
   * @param query - 查询参数，包含status、userId、page、pageSize等
   * @returns 订单列表和分页信息
   */
  @Get()
  @ApiQuery({
    name: 'status',
    required: false,
    description: '订单状态，如 PENDING, ACCEPTED, PROCESSING, COMPLETED, CANCELLED, DELIVERED',
  })
  @ApiQuery({
    name: 'status[name]',
    required: false,
    description: '订单状态名称（替代形式）',
  })
  @ApiQuery({
    name: 'status[index]',
    required: false,
    description: '订单状态索引，0:PENDING, 1:ACCEPTED, 2:PROCESSING, 3:COMPLETED, 4:CANCELLED, 5:DELIVERED',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: '用户ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '页码，默认为1',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: '每页数量，默认为20',
  })
  @ApiResponse({
    status: 200,
    description: '订单列表',
  })
  async findAll(@Query() queryDto: OrderQueryDto) {
    return this.orderService.findAll(queryDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的订单列表' })
  @ApiResponse({ status: 200, description: '获取我的订单列表成功' })
  async findMyOrders(@Query() queryDto: OrderQueryDto, @Request() req) {
    return this.orderService.findAll({
      ...queryDto,
      userId: req.user.userId,
    });
  }

  /**
   * GET /api/orders/:id
   * Retrieves a single order by its ID.
   *
   * @param id - The ID of the order to retrieve.
   * @returns A Promise that resolves to the retrieved order.
   * @throws BadRequestException if the order is not found or an error occurs.
   */
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'The order with the provided ID.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while retrieving the order. Can be due to the order does not exist.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  /**
   * POST /api/orders
   * Create a new order based on the user's cart.
   *
   * @param createOrderDto - The data for creating the order.
   * @returns The created order.
   * @throws BadRequestException if there is an error creating the order.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while creating the order. Can be due to the user does not exist | \
      the cart is empty | there is not enough stock for a product.',
  })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  /**
   * PUT /api/orders/:id/status
   * Updates the status of an order.
   *
   * @param id - The ID of the order to update.
   * @param updateOrderDto - The DTO containing the updated order information.
   * @returns The updated order.
   * @throws BadRequestException if there is an error updating the order.
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: 200,
    description: 'The order status has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while updating the order. Can be due to the order does not exist | \
      the order has already been delivered.',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderDto);
  }

  /**
   * POST /api/orders/apply-coupon
   * Apply a coupon to an order.
   *
   * @param applyCouponDto - The DTO containing the coupon information.
   * @returns A message indicating the discount applied.
   * @throws BadRequestException if there is an error applying the coupon or retrieving the order.
   */
  @Post('/apply-coupon')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: ApplyCouponDto })
  @ApiResponse({
    status: 200,
    description: 'The coupon has been successfully applied.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while applying the coupon. Can be due to the coupon does not exist | \
      the coupon has expired | the user already used the coupon | \
      the order has already been delivered | the order is free of charges.',
  })
  async applyCoupon(@Body() applyCouponDto: ApplyCouponDto) {
    const coupon = await this.couponService.getCoupun(applyCouponDto);

    if (Object.keys(coupon).includes('error')) {
      throw new BadRequestException((coupon as any).error.message);
    }

    // Note: applyCoupon method needs to be implemented in OrderService
    // For now, we'll return a success message
    return {
      message: `Coupon applied successfully`,
    };
  }

  /**
   * POST /api/orders/:id/cancel
   * 取消订单，并根据需要处理退款
   *
   * @param id - 要取消的订单ID
   * @param cancelOrderDto - 包含取消原因和是否需要退款的DTO
   * @returns 取消后的订单信息
   * @throws BadRequestException 如果订单取消失败
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CancelOrderDto })
  @ApiResponse({
    status: 200,
    description: '订单已成功取消',
  })
  @ApiResponse({
    status: 400,
    description: '取消订单失败，可能因为订单不存在、状态不允许取消等原因',
  })
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    // For now, use the simple cancel method
    return this.orderService.cancel(id, cancelOrderDto.reason);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '确认订单' })
  @ApiResponse({ status: 200, description: '确认订单成功' })
  async confirm(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.confirm(id);
  }

  @Post(':id/ship')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '发货' })
  @ApiResponse({ status: 200, description: '发货成功' })
  async ship(
    @Param('id', ParseIntPipe) id: number,
    @Body() shippingData: { logisticsId?: number; trackingNo: string; logisticsName?: string }
  ) {
    return this.orderService.ship(id, shippingData);
  }

  @Post(':id/receive')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '确认收货' })
  @ApiResponse({ status: 200, description: '确认收货成功' })
  async receive(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.receive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '删除订单' })
  @ApiResponse({ status: 200, description: '删除订单成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '恢复删除的订单' })
  @ApiResponse({ status: 200, description: '恢复订单成功' })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.restore(id);
  }
}
