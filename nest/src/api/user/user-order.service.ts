// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UserOrderQueryDto, CancelOrderDto, ConfirmReceiptDto } from './dto/user-order.dto';

@Injectable()
export class UserOrderService {
  constructor(private prisma: PrismaService) {}

  async getOrderList(userId: number, query: UserOrderQueryDto) {
    const { page = 1, size = 15, order_status, keyword } = query;
    const skip = (page - 1) * size;

    const where: any = {
      user_id: userId,
      is_delete: 0,
    };

    if (order_status !== undefined) {
      where.order_status = order_status;
    }

    if (keyword) {
      where.OR = [
        { order_sn: { contains: keyword } },
        { order_items: { some: { product_name: { contains: keyword } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          order_items: {
            include: {
              product: {
                select: {
                  product_id: true,
                  product_name: true,
                  image: true,
                  price: true,
                },
              },
            },
          },
          user_address: true,
          shop: {
            select: {
              shop_id: true,
              shop_name: true,
              shop_logo: true,
            },
          },
        },
        orderBy: { add_time: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.order.count({ where }),
    ]);

    // 处理订单状态文本
    const processedOrders = orders.map(order => ({
      ...order,
      order_status_text: this.getOrderStatusText(order.order_status),
      pay_status_text: this.getPayStatusText(order.pay_status),
      order_items: order.order_items.map(item => ({
        ...item,
        product_image: item.product.image,
        product_price: item.product.price,
      })),
    }));

    return {
      code: 200,
      message: '获取成功',
      data: {
        records: processedOrders,
        total,
        page,
        size,
      },
    };
  }

  async getOrderDetail(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
        is_delete: 0,
      },
      include: {
        order_items: {
          include: {
            product: {
              select: {
                product_id: true,
                product_name: true,
                image: true,
                price: true,
                spec_value: true,
              },
            },
          },
        },
        user_address: true,
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
            shop_logo: true,
            contact_phone: true,
          },
        },
        invoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 获取订单操作日志
    const orderLogs = await this.prisma.order_log.findMany({
      where: { order_id: orderId },
      orderBy: { add_time: 'desc' },
    });

    // 获取支付记录
    const paymentLogs = await this.prisma.pay_log.findMany({
      where: { order_id: orderId },
      orderBy: { add_time: 'desc' },
    });

    return {
      code: 200,
      message: '获取成功',
      data: {
        order: {
          ...order,
          order_status_text: this.getOrderStatusText(order.order_status),
          pay_status_text: this.getPayStatusText(order.pay_status),
          order_items: order.order_items.map(item => ({
            ...item,
            product_image: item.product.image,
            product_price: item.product.price,
          })),
        },
        order_logs: orderLogs,
        payment_logs: paymentLogs,
      },
    };
  }

  async getOrderStatistics(userId: number) {
    const baseWhere = {
      user_id: userId,
      is_delete: 0,
    };

    const [pendingPayment, pendingDelivery, pendingReceipt, completed, total] = await Promise.all([
      this.prisma.order.count({ where: { ...baseWhere, order_status: 1 } }), // 待付款
      this.prisma.order.count({ where: { ...baseWhere, order_status: 2 } }), // 待发货
      this.prisma.order.count({ where: { ...baseWhere, order_status: 3 } }), // 待收货
      this.prisma.order.count({ where: { ...baseWhere, order_status: 4 } }), // 已完成
      this.prisma.order.count({ where: baseWhere }), // 全部
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        pending_payment: pendingPayment,
        pending_delivery: pendingDelivery,
        pending_receipt: pendingReceipt,
        completed: completed,
        total: total,
      },
    };
  }

  async cancelOrder(userId: number, cancelDto: CancelOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: cancelDto.order_id,
        user_id: userId,
        order_status: 1, // 只有待付款状态可以取消
        is_delete: 0,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在或状态不正确');
    }

    await this.prisma.$transaction(async (prisma) => {
      // 更新订单状态
      await prisma.order.update({
        where: { order_id: cancelDto.order_id },
        data: {
          order_status: 7, // 已取消
          cancel_reason: cancelDto.reason,
          cancel_time: Math.floor(Date.now() / 1000),
        },
      });

      // 恢复商品库存
      const orderItems = await prisma.order_item.findMany({
        where: { order_id: cancelDto.order_id },
      });

      for (const item of orderItems) {
        await prisma.product.update({
          where: { product_id: item.product_id },
          data: { stock: { increment: item.product_num } },
        });
      }

      // 添加订单日志
      await prisma.order_log.create({
        data: {
          order_id: cancelDto.order_id,
          user_id: userId,
          action: 'cancel',
          action_text: '用户取消订单',
          remark: cancelDto.reason,
          add_time: Math.floor(Date.now() / 1000),
        },
      });
    });

    return {
      code: 200,
      message: '订单取消成功',
      data: null,
    };
  }

  async deleteOrder(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 只有已完成、已取消或已关闭的订单可以删除
    const deletableStatus = [4, 5, 6, 7]; // 已完成、已关闭、已退款、已取消
    if (!deletableStatus.includes(order.order_status)) {
      throw new BadRequestException('订单状态不允许删除');
    }

    await this.prisma.order.update({
      where: { order_id: orderId },
      data: {
        is_delete: 1,
        delete_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: '订单删除成功',
      data: null,
    };
  }

  async confirmReceipt(userId: number, confirmDto: ConfirmReceiptDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: confirmDto.order_id,
        user_id: userId,
        order_status: 3, // 待收货状态
        is_delete: 0,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在或状态不正确');
    }

    await this.prisma.$transaction(async (prisma) => {
      // 更新订单状态
      await prisma.order.update({
        where: { order_id: confirmDto.order_id },
        data: {
          order_status: 4, // 已完成
          confirm_time: Math.floor(Date.now() / 1000),
        },
      });

      // 添加订单日志
      await prisma.order_log.create({
        data: {
          order_id: confirmDto.order_id,
          user_id: userId,
          action: 'confirm_receipt',
          action_text: '用户确认收货',
          remark: confirmDto.remark || '',
          add_time: Math.floor(Date.now() / 1000),
        },
      });

      // 自动确认收货后，如果满足条件则自动结算
      await this.processOrderSettlement(prisma, confirmDto.order_id);
    });

    return {
      code: 200,
      message: '确认收货成功',
      data: null,
    };
  }

  async getShippingInfo(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
        is_delete: 0,
      },
      include: {
        order_items: {
          select: {
            product_id: true,
            product_name: true,
            product_image: true,
            product_num: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.order_status < 3) {
      throw new BadRequestException('订单还未发货');
    }

    // 获取物流信息
    const shippingInfo = await this.prisma.order_shipping.findFirst({
      where: { order_id: orderId },
    });

    if (!shippingInfo) {
      throw new NotFoundException('物流信息不存在');
    }

    // 获取物流轨迹（这里需要集成第三方物流查询API）
    const shippingTracks = await this.getShippingTracks(shippingInfo.tracking_number);

    return {
      code: 200,
      message: '获取成功',
      data: {
        order: {
          order_id: order.order_id,
          order_sn: order.order_sn,
          items: order.order_items,
        },
        shipping: shippingInfo,
        tracks: shippingTracks,
      },
    };
  }

  async buyAgain(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
        is_delete: 0,
      },
      include: {
        order_items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查商品是否还存在且有库存
    const cartItems = [];
    for (const item of order.order_items) {
      if (!item.product || item.product.is_delete === 1) {
        throw new BadRequestException(`商品"${item.product_name}"已下架`);
      }

      if (item.product.stock < item.product_num) {
        throw new BadRequestException(`商品"${item.product_name}"库存不足`);
      }

      cartItems.push({
        user_id: userId,
        product_id: item.product_id,
        num: item.product_num,
        add_time: Math.floor(Date.now() / 1000),
      });
    }

    // 添加到购物车
    await this.prisma.cart.createMany({
      data: cartItems,
    });

    return {
      code: 200,
      message: '已添加到购物车',
      data: {
        added_count: cartItems.length,
      },
    };
  }

  private getOrderStatusText(status: number): string {
    const statusMap = {
      0: '已关闭',
      1: '待付款',
      2: '待发货',
      3: '待收货',
      4: '已完成',
      5: '已退款',
      6: '已取消',
      7: '已取消',
    };
    return statusMap[status] || '未知状态';
  }

  private getPayStatusText(status: number): string {
    const statusMap = {
      0: '未支付',
      1: '已支付',
      2: '已退款',
    };
    return statusMap[status] || '未知状态';
  }

  private async processOrderSettlement(prisma: any, orderId: number) {
    // 订单结算逻辑
    // 包括：佣金结算、商家资金结算等
  }

  private async getShippingTracks(trackingNumber: string) {
    // 调用第三方物流查询API获取物流轨迹
    // 这里返回示例数据
    return [
      {
        time: '2024-01-01 10:00:00',
        location: '北京',
        status: '已揽收',
      },
      {
        time: '2024-01-01 18:00:00',
        location: '上海',
        status: '运输中',
      },
    ];
  }
}
