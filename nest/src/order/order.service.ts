import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CartService } from '../cart/cart.service';

export interface CreateOrderDto {
  addressId: number;
  couponId?: number;
  remark?: string;
  paymentMethod: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cartService: CartService,
  ) {}

  /**
   * 创建订单
   * @param userId 用户ID
   * @param createOrderDto 订单数据
   * @returns 创建的订单
   */
  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const { addressId, couponId, remark, paymentMethod } = createOrderDto;

    // 获取用户购物车
    const cart = await this.cartService.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('购物车为空，无法创建订单');
    }

    // 获取用户地址
    const address = await this.prisma.userAddress.findUnique({
      where: { addressId: addressId },
    });

    if (!address) {
      throw new BadRequestException('收货地址不存在');
    }

    // 验证库存
    for (const item of cart.items) {
      const product = await this.prisma.product.findUnique({
        where: { productId: item.productId },
      });

      if (!product || product.isDelete !== 0) {
        throw new BadRequestException(`商品 ${item.productId} 已下架`);
      }

      if (product.productStock < item.quantity) {
        throw new BadRequestException(`商品 ${item.productId} 库存不足`);
      }
    }

    // 计算订单金额
    let totalAmount = cart.totalPrice;
    let discountAmount = 0;
    let shippingFee = this.calculateShippingFee(cart.items);

    // 处理优惠券
    if (couponId) {
      const coupon = await this.prisma.userCoupon.findUnique({
        where: { id: couponId },
        include: { coupon: true },
      });

      if (!coupon || coupon.usedTime !== null) {
        throw new BadRequestException('优惠券不可用');
      }

      const now = new Date();
      if (coupon.coupon.useStartDate > now || coupon.coupon.useEndDate < now) {
        throw new BadRequestException('优惠券已过期');
      }

      if (totalAmount < Number(coupon.coupon.minOrderAmount || 0)) {
        throw new BadRequestException(`订单金额未达到优惠券使用门槛: ${coupon.coupon.minOrderAmount}`);
      }

      if (coupon.coupon.couponType === 1) { // 固定金额
        discountAmount = Number(coupon.coupon.couponMoney);
      } else if (coupon.coupon.couponType === 2) { // 百分比
        discountAmount = totalAmount * Number(coupon.coupon.couponDiscount) / 100;
      }

      // 优惠金额不能超过订单金额
      discountAmount = Math.min(discountAmount, totalAmount);
    }

    const paymentAmount = totalAmount - discountAmount + shippingFee;

    // 生成订单号
    const orderSn = this.generateOrderSn();

    // 开启事务
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建订单 - 使用原始SQL来避免XOR类型问题
      const order = await tx.$queryRaw`
        INSERT INTO "Order" (
          "userId", "orderSn", "totalAmount", "discountAmount", "shippingFee",
          "paymentAmount", "paymentMethod", "remark", "status", "paymentStatus",
          "shippingStatus", "createdAt", "updatedAt"
        ) VALUES (
          ${userId}, ${orderSn}, ${totalAmount}, ${discountAmount}, ${shippingFee},
          ${paymentAmount}, ${paymentMethod}, ${remark}, 'PENDING', 'UNPAID',
          'UNSHIPPED', ${new Date()}, ${new Date()}
        )
        RETURNING *
      ` as any;

      // 获取创建的订单ID
      const orderId = (order as any)[0].orderId;

      // 订单地址信息已直接存储在Order表中，无需单独创建

      // 创建订单项 - 使用原始SQL避免XOR类型问题
      for (const item of cart.items) {
        await tx.$queryRaw`
          INSERT INTO "OrderItem" (
            "orderId", "productId", "quantity", "price", "productName", "picThumb"
          ) VALUES (
            ${orderId}, ${item.productId}, ${item.quantity}, ${item.originalPrice}, ${item.productSn || ''}, ${item.picThumb || ''}
          )
        `;

        // 扣减库存
        await tx.product.update({
          where: { productId: item.productId },
          data: {
            productStock: {
              decrement: item.quantity,
            },
            clickCount: {
              increment: item.quantity,
            },
          },
        });
      }

      // 使用优惠券
      if (couponId) {
        await tx.userCoupon.update({
          where: { id: couponId },
          data: {
            usedTime: new Date(),
          },
        });
      }

      // 清空购物车
      await tx.cart.deleteMany({
        where: {
          userId,
          isChecked: 1, // 只清空选中的商品
        },
      });

      return { orderId };
    });

    return this.getOrderDetail(result.orderId);
  }

  /**
   * 获取订单列表
   * @param userId 用户ID
   * @param query 查询参数
   * @returns 订单列表
   */
  async getOrderList(userId: number, query: any = {}) {
    const {
      page = 1,
      size = 10,
      status,
      paymentStatus,
      keyword,
    } = query;

    const skip = (page - 1) * size;
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (keyword) {
      where.orderSn = { contains: keyword };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: size,
        include: {
          // orderAddress: true, // 地址信息已直接存储在Order表中
          orderItems: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                },
              },
            },
          },
          payments: true,
        },
        orderBy: { addTime: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      list: orders,
      total,
      page,
      limit: size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取订单详情
   * @param orderId 订单ID
   * @param userId 用户ID
   * @returns 订单详情
   */
  async getOrderDetail(orderId: number, userId?: number) {
    const where: any = { orderId };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        // OrderAddress: true, // Address info is now stored directly in Order table
        orderItems: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
        payments: true,
        user: {
          select: {
            userId: true,
            nickname: true,
            mobile: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  /**
   * 取消订单
   * @param orderId 订单ID
   * @param userId 用户ID
   * @param reason 取消原因
   * @returns 更新后的订单
   */
  async cancelOrder(orderId: number, userId: number, reason?: string) {
    const order = await this.getOrderDetail(orderId, userId);

    if (order.orderStatus !== 0) { // PENDING = 0
      throw new BadRequestException('只有待付款的订单才能取消');
    }

    // 恢复库存
    for (const item of order.orderItems) {
      await this.prisma.product.update({
        where: { productId: item.productId },
        data: {
          productStock: {
            increment: item.quantity,
          },
          clickCount: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 更新订单状态
    return this.prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 2, // CANCELLED = 2
        // cancelReason and cancelTime fields don't exist in schema
      },
    });
  }

  /**
   * 确认收货
   * @param orderId 订单ID
   * @param userId 用户ID
   * @returns 更新后的订单
   */
  async confirmReceive(orderId: number, userId: number) {
    const order = await this.getOrderDetail(orderId, userId);

    if (order.orderStatus !== 1) { // SHIPPED = 1
      throw new BadRequestException('只有已发货的订单才能确认收货');
    }

    return this.prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 3, // COMPLETED = 3
        // completeTime field doesn't exist in schema
      },
    });
  }

  /**
   * 删除订单
   * @param orderId 订单ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async deleteOrder(orderId: number, userId: number) {
    const order = await this.getOrderDetail(orderId, userId);

    if (![2, 3].includes(order.orderStatus)) { // CANCELLED = 2, COMPLETED = 3
      throw new BadRequestException('只能删除已取消或已完成的订单');
    }

    await this.prisma.order.delete({
      where: { orderId },
    });

    return { message: '订单删除成功' };
  }

  /**
   * 获取订单统计
   * @param userId 用户ID
   * @returns 订单统计
   */
  async getOrderStats(userId: number) {
    const [total, pending, paid, shipped, completed, cancelled] = await Promise.all([
      this.prisma.order.count({ where: { userId } }),
      this.prisma.order.count({ where: { userId, orderStatus: 0 } }), // PENDING = 0
      this.prisma.order.count({ where: { userId, payStatus: 1 } }), // PAID = 1
      this.prisma.order.count({ where: { userId, orderStatus: 1 } }), // SHIPPED = 1
      this.prisma.order.count({ where: { userId, orderStatus: 3 } }), // COMPLETED = 3
      this.prisma.order.count({ where: { userId, orderStatus: 2 } }), // CANCELLED = 2
    ]);

    return {
      total,
      pending,
      paid,
      shipped,
      completed,
      cancelled,
    };
  }

  /**
   * 计算运费
   * @param items 购物车商品
   * @returns 运费
   */
  private calculateShippingFee(items: any[]): number {
    // 简单的运费计算逻辑
    // 实际项目中可能需要更复杂的计算，比如根据地区、重量等
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    // 满99免运费
    if (totalAmount >= 99) {
      return 0;
    }

    return 10; // 默认运费10元
  }

  /**
   * 生成订单号
   * @returns 订单号
   */
  private generateOrderSn(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    const timeStr = date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `${dateStr}${timeStr}${random}`;
  }
}