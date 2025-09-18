import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CartService } from '../cart/cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Order Checkout')
@Controller('order/check')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class OrderCheckController {
  constructor(
    private readonly orderService: OrderService,
    private readonly cartService: CartService,
  ) {}

  /**
   * 获取订单结算数据 - 对齐PHP版本 order/check/index
   */
  @Post('index')
  @ApiOperation({ summary: '获取订单结算数据' })
  async getCheckoutData(@Request() req, @Body() data: any) {
    const cart = await this.cartService.getCart(req.user.userId);

    return {
      cartItems: cart.items,
      totalPrice: cart.totalPrice,
      totalQuantity: cart.totalQuantity,
      shippingFee: this.calculateShippingFee(cart.totalPrice),
      discountAmount: 0,
      paymentAmount: cart.totalPrice + this.calculateShippingFee(cart.totalPrice),
      availablePayments: [
        { id: 'alipay', name: '支付宝', icon: '/images/payment/alipay.png' },
        { id: 'wechat', name: '微信支付', icon: '/images/payment/wechat.png' },
      ],
      availableShipping: [
        { id: 'standard', name: '标准快递', fee: 10, estimatedDays: 3 },
        { id: 'express', name: '次日达', fee: 20, estimatedDays: 1 },
      ],
    };
  }

  /**
   * 更新订单结算数据 - 对齐PHP版本 order/check/update
   */
  @Post('update')
  @ApiOperation({ summary: '更新订单结算数据' })
  async updateCheckoutData(@Request() req, @Body() data: any) {
    // 简化实现，返回成功
    return { success: true };
  }

  /**
   * 更新优惠券 - 对齐PHP版本 order/check/updateCoupon
   */
  @Post('updateCoupon')
  @ApiOperation({ summary: '更新优惠券' })
  async updateCoupon(@Request() req, @Body() data: { couponId: number }) {
    // 简化实现，返回折扣信息
    return {
      discountAmount: 0,
      message: '优惠券无效或已过期',
    };
  }

  /**
   * 提交订单 - 对齐PHP版本 order/check/submit
   */
  @Post('submit')
  @ApiOperation({ summary: '提交订单' })
  async submitOrder(@Request() req, @Body() data: any) {
    return this.orderService.createOrder(req.user.userId, data);
  }

  /**
   * 获取可用支付方式 - 对齐PHP版本 order/check/getAvailablePaymentType
   */
  @Get('getAvailablePaymentType')
  @ApiOperation({ summary: '获取可用支付方式' })
  async getAvailablePaymentTypes() {
    return [
      { id: 'alipay', name: '支付宝', status: 1 },
      { id: 'wechat', name: '微信支付', status: 1 },
      { id: 'unionpay', name: '银联支付', status: 0 },
    ];
  }

  /**
   * 获取配送方式 - 对齐PHP版本 order/check/getStoreShippingType
   */
  @Get('getStoreShippingType')
  @ApiOperation({ summary: '获取配送方式' })
  async getShippingTypes(@Query() query: { storeId?: number }) {
    return [
      { id: 'standard', name: '标准快递', price: 10, description: '3个工作日送达' },
      { id: 'express', name: '次日达', price: 20, description: '次日送达' },
      { id: 'pickup', name: '到店自提', price: 0, description: '到店自提' },
    ];
  }

  /**
   * 计算运费
   */
  private calculateShippingFee(totalAmount: number): number {
    // 满99免运费
    if (totalAmount >= 99) {
      return 0;
    }
    return 10;
  }
}