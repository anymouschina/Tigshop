// @ts-nocheck
import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { OrderConfigService } from './order-config.service';
import { UpdateOrderConfigDto, OrderPaymentConfigDto, OrderShippingConfigDto } from './dto/order-config.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('订单配置')
@Controller('admin/order-config')
@UseGuards(RolesGuard)
@Roles('admin')
export class OrderConfigController {
  constructor(private readonly orderConfigService: OrderConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取订单配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOrderConfig() {
    const config = await this.orderConfigService.getOrderConfig();
    return {
      code: 200,
      message: '获取成功',
      data: config,
    };
  }

  @Put()
  @ApiOperation({ summary: '更新订单配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateOrderConfig(@Body() configDto: UpdateOrderConfigDto) {
    const result = await this.orderConfigService.updateOrderConfig(configDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Get('payment')
  @ApiOperation({ summary: '获取支付配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPaymentConfig() {
    const config = await this.orderConfigService.getPaymentConfig();
    return {
      code: 200,
      message: '获取成功',
      data: config,
    };
  }

  @Put('payment')
  @ApiOperation({ summary: '更新支付配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updatePaymentConfig(@Body() paymentConfig: OrderPaymentConfigDto) {
    const result = await this.orderConfigService.updatePaymentConfig(paymentConfig);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Get('shipping')
  @ApiOperation({ summary: '获取配送配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getShippingConfig() {
    const config = await this.orderConfigService.getShippingConfig();
    return {
      code: 200,
      message: '获取成功',
      data: config,
    };
  }

  @Put('shipping')
  @ApiOperation({ summary: '更新配送配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateShippingConfig(@Body() shippingConfig: OrderShippingConfigDto) {
    const result = await this.orderConfigService.updateShippingConfig(shippingConfig);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Get('auto-settings')
  @ApiOperation({ summary: '获取自动设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAutoSettings() {
    const settings = await this.orderConfigService.getAutoSettings();
    return {
      code: 200,
      message: '获取成功',
      data: settings,
    };
  }

  @Put('auto-settings')
  @ApiOperation({ summary: '更新自动设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateAutoSettings(@Body() settings: any) {
    const result = await this.orderConfigService.updateAutoSettings(settings);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Post('test-shipping')
  @ApiOperation({ summary: '测试配送费用计算' })
  @ApiResponse({ status: 200, description: '测试成功' })
  async testShippingCalculation(@Body() testData: {
    total_amount: number;
    total_weight: number;
    shipping_address: any;
  }) {
    const result = await this.orderConfigService.calculateShippingFee(testData);
    return {
      code: 200,
      message: '计算成功',
      data: result,
    };
  }

  @Get('status-list')
  @ApiOperation({ summary: '获取订单状态列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatusList() {
    const statusList = await this.orderConfigService.getOrderStatusList();
    return {
      code: 200,
      message: '获取成功',
      data: statusList,
    };
  }
}
