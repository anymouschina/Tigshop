// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderCheckDto, OrderUpdateDto, OrderSubmitDto } from './dto/order-check.dto';

@Injectable()
export class OrderCheckService {
  constructor(private prisma: PrismaService) {}

  async getOrderCheckData(userId: number, flowType: number = 1) {
    // 检查用户是否实名认证（B2B模式）
    if (flowType === 2) {
      await this.checkUserCompanyAuth(userId);
    }

    // 获取购物车数据
    const cartList = await this.getStoreCarts(userId, flowType);
    if (!cartList.carts || cartList.carts.length === 0) {
      throw new BadRequestException('您还未选择商品！');
    }

    // 构建购物车促销信息
    const processedCartList = await this.buildCartPromotion(cartList, userId, flowType);

    // 获取用户地址列表
    const addressList = await this.getUserAddresses(userId);

    // 获取可用支付方式
    const paymentTypes = await this.getAvailablePaymentType();

    // 获取店铺配送方式
    const shippingTypes = await this.getStoreShippingType(1);

    // 计算总费用
    const total = await this.calculateTotalFee(processedCartList);

    return {
      code: 200,
      message: '获取成功',
      data: {
        address_list: addressList,
        available_payment_type: paymentTypes,
        store_shipping_type: shippingTypes,
        cart_list: processedCartList.carts,
        total,
        flow_type: flowType,
      },
    };
  }

  async updateOrderCheck(userId: number, updateDto: OrderUpdateDto) {
    // 更新用户选中的地址
    if (updateDto.address_id) {
      await this.prisma.user_address.updateMany({
        where: { user_id: userId },
        data: { is_default: 0 },
      });

      await this.prisma.user_address.update({
        where: { address_id: updateDto.address_id },
        data: { is_default: 1 },
      });
    }

    // 更新购物车的配送方式等其他信息
    // 这里需要根据具体业务逻辑实现

    return {
      code: 200,
      message: '更新成功',
      data: null,
    };
  }

  async updateOrderCoupon(userId: number, couponIds: number[]) {
    // 更新订单优惠券逻辑
    // 这里需要验证优惠券的有效性和使用条件

    return {
      code: 200,
      message: '优惠券更新成功',
      data: null,
    };
  }

  async submitOrder(userId: number, submitDto: OrderSubmitDto) {
    // 验证用户地址
    if (!submitDto.address_id) {
      throw new BadRequestException('请选择收货地址');
    }

    const address = await this.prisma.user_address.findFirst({
      where: {
        address_id: submitDto.address_id,
        user_id: userId,
      },
    });

    if (!address) {
      throw new NotFoundException('收货地址不存在');
    }

    // 验证购物车商品
    const cartItems = await this.prisma.cart.findMany({
      where: {
        user_id: userId,
        cart_id: { in: submitDto.cart_ids },
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('购物车中没有商品');
    }

    // 检查库存
    for (const item of cartItems) {
      if (item.product.stock < item.num) {
        throw new BadRequestException(`商品 "${item.product.product_name}" 库存不足`);
      }
    }

    // 创建订单
    const orderData = {
      user_id: userId,
      order_sn: this.generateOrderSn(),
      total_amount: submitDto.total_amount,
      shipping_fee: submitDto.shipping_fee || 0,
      pay_amount: submitDto.pay_amount,
      address_id: submitDto.address_id,
      pay_type: submitDto.pay_type_id,
      order_status: 1, // 待付款
      shop_id: 1,
      add_time: Math.floor(Date.now() / 1000),
    };

    const order = await this.prisma.order.create({
      data: orderData,
    });

    // 创建订单商品
    for (const item of cartItems) {
      await this.prisma.order_item.create({
        data: {
          order_id: order.order_id,
          product_id: item.product_id,
          product_name: item.product.product_name,
          product_image: item.product.image,
          product_price: item.product.price,
          product_num: item.num,
          total_amount: item.product.price * item.num,
        },
      });

      // 减少库存
      await this.prisma.product.update({
        where: { product_id: item.product_id },
        data: { stock: { decrement: item.num } },
      });
    }

    // 清空购物车中已下单的商品
    await this.prisma.cart.deleteMany({
      where: {
        user_id: userId,
        cart_id: { in: submitDto.cart_ids },
      },
    });

    return {
      code: 200,
      message: '下单成功',
      data: {
        order_id: order.order_id,
        order_sn: order.order_sn,
      },
    };
  }

  async getLastInvoice(userId: number) {
    const lastOrder = await this.prisma.order.findFirst({
      where: { user_id: userId },
      orderBy: { add_time: 'desc' },
      include: {
        invoice: true,
      },
    });

    if (!lastOrder || !lastOrder.invoice) {
      return {
        code: 200,
        message: '获取成功',
        data: null,
      };
    }

    return {
      code: 200,
      message: '获取成功',
      data: lastOrder.invoice,
    };
  }

  async getAvailablePaymentType() {
    // 获取系统配置的支付方式
    const paymentTypes = [
      { id: 1, name: '微信支付', code: 'wechat', icon: 'wechat', is_available: 1 },
      { id: 2, name: '支付宝', code: 'alipay', icon: 'alipay', is_available: 1 },
      { id: 3, name: '余额支付', code: 'balance', icon: 'balance', is_available: 1 },
    ];

    return {
      code: 200,
      message: '获取成功',
      data: paymentTypes.filter(type => type.is_available === 1),
    };
  }

  async getStoreShippingType(shopId: number) {
    // 获取店铺配送方式
    const shippingTypes = [
      { id: 1, name: '快递配送', code: 'express', fee: 10, is_available: 1 },
      { id: 2, name: '上门自提', code: 'pickup', fee: 0, is_available: 1 },
    ];

    return {
      code: 200,
      message: '获取成功',
      data: shippingTypes.filter(type => type.is_available === 1),
    };
  }

  private async checkUserCompanyAuth(userId: number) {
    const companyAuth = await this.prisma.user_company.findFirst({
      where: { user_id: userId, status: 1 },
    });

    if (!companyAuth) {
      throw new BadRequestException('请先完成企业实名认证');
    }
  }

  private async getStoreCarts(userId: number, flowType: number) {
    const carts = await this.prisma.cart.findMany({
      where: { user_id: userId },
      include: {
        product: {
          include: {
            shop: true,
          },
        },
      },
    });

    // 按店铺分组
    const shopCarts = {};
    carts.forEach(cart => {
      const shopId = cart.product.shop_id;
      if (!shopCarts[shopId]) {
        shopCarts[shopId] = {
          shop_id: shopId,
          shop_name: cart.product.shop.shop_name,
          carts: [],
        };
      }
      shopCarts[shopId].carts.push(cart);
    });

    return {
      carts: Object.values(shopCarts),
      total_count: carts.length,
    };
  }

  private async buildCartPromotion(cartList: any, userId: number, flowType: number) {
    // 构建购物车促销信息
    // 这里需要实现优惠券、满减等促销逻辑
    return cartList;
  }

  private async getUserAddresses(userId: number) {
    return await this.prisma.user_address.findMany({
      where: { user_id: userId },
      orderBy: { is_default: 'desc' },
    });
  }

  private async calculateTotalFee(cartList: any) {
    let totalAmount = 0;
    let shippingFee = 0;

    cartList.carts.forEach(shopCart => {
      shopCart.carts.forEach(cart => {
        totalAmount += cart.product.price * cart.num;
      });
    });

    return {
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      pay_amount: totalAmount + shippingFee,
    };
  }

  private generateOrderSn(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random.toString().padStart(3, '0')}`;
  }
}
