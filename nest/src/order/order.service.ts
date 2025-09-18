import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateOrderDto, OrderStatus, ShippingStatus, PayStatus, OrderItemDto, OrderType, PayTypeId } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { DatabaseService } from 'src/database/database.service';
import { Prisma, OrderStatus as PrismaOrderStatus, ShippingStatus as PrismaShippingStatus, PaymentStatus as PrismaPaymentStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 创建订单
   * @param createOrderDto 订单创建数据
   * @returns 创建的订单信息
   */
  async create(createOrderDto: CreateOrderDto) {
    const { userId, items, productAmount, shippingFee, discountAmount, totalAmount } = createOrderDto;

    // 检查用户是否存在
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查商品库存
    const stockCheckResults = await this.checkProductStock(items);
    if (stockCheckResults.length > 0) {
      throw new ConflictException('库存不足', { cause: stockCheckResults });
    }

    // 生成订单号
    const orderSn = this.generateOrderSn();

    // 使用事务创建订单
    const result = await this.databaseService.$transaction(async (tx) => {
      // 创建订单
      const order = await tx.order.create({
        data: {
          orderSn,
          userId,
          totalAmount,
          discountAmount,
          shippingFee,
          paymentAmount: totalAmount,
          remark: createOrderDto.buyerNote,
        },
      });

      // 创建订单项
      const orderItems = items.map(item => ({
        orderId: order.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
        productName: item.productName,
        productImage: item.productImage,
        specValue: item.skuValue,
      }));

      await tx.orderItem.createMany({
        data: orderItems,
      });

      // 创建订单地址
      await tx.orderAddress.create({
        data: {
          orderId: order.orderId,
          name: createOrderDto.consignee,
          mobile: createOrderDto.mobile,
          province: createOrderDto.regionNames?.[0] || '',
          city: createOrderDto.regionNames?.[1] || '',
          district: createOrderDto.regionNames?.[2] || '',
          address: createOrderDto.address,
        },
      });

      // 扣除商品库存
      for (const item of items) {
        await tx.product.update({
          where: { productId: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });

    return result;
  }

  /**
   * 检查商品库存
   * @param items 订单项
   * @returns 库存不足的商品列表
   */
  private async checkProductStock(items: OrderItemDto[]): Promise<any[]> {
    const insufficientStockItems: any[] = [];

    for (const item of items) {
      const product = await this.databaseService.product.findUnique({
        where: { productId: item.productId },
      });

      if (!product || product.stock < item.quantity) {
        insufficientStockItems.push({
          productId: item.productId,
          productName: item.productName,
          requestedQuantity: item.quantity,
          availableStock: product?.stock || 0,
        });
      }
    }

    return insufficientStockItems;
  }

  /**
   * 生成订单号
   * @returns 订单号
   */
  private generateOrderSn(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORDER_${timestamp}_${random}`;
  }

  /**
   * 更新订单状态
   * @param orderId 订单ID
   * @param updateOrderDto 更新数据
   * @returns 更新后的订单信息
   */
  async updateStatus(orderId: number, updateOrderDto: UpdateOrderDto) {
    // 检查订单是否存在
    const existingOrder = await this.databaseService.order.findUnique({
      where: { orderId },
    });

    if (!existingOrder) {
      throw new NotFoundException('订单不存在');
    }

    // 更新订单
    const updatedOrder = await this.databaseService.order.update({
      where: { orderId },
      data: {
        status: updateOrderDto.status as unknown as PrismaOrderStatus,
        paymentStatus: updateOrderDto.paymentStatus as unknown as PrismaPaymentStatus,
        shippingStatus: updateOrderDto.shippingStatus as unknown as PrismaShippingStatus,
        paymentTime: updateOrderDto.paymentStatus === PayStatus.PAID ? new Date() : null,
        shippingTime: updateOrderDto.shippingStatus === 1 ? new Date() : null,
        receiveTime: updateOrderDto.shippingStatus === 2 ? new Date() : null,
        completeTime: updateOrderDto.status === 5 ? new Date() : null,
      },
      include: {
        items: true,
        addresses: true,
        user: true,
      },
    });

    return updatedOrder;
  }

  /**
   * 查询订单列表
   * @param queryDto 查询参数
   * @returns 订单列表
   */
  async findAll(queryDto: OrderQueryDto) {
    const {
      page = 1,
      size = 15,
      orderSn,
      userId,
      status,
      paymentStatus,
      shippingStatus,
      startDate,
      endDate,
      sortField = 'orderId',
      sortOrder = 'desc',
    } = queryDto;

    const where: Prisma.OrderWhereInput = {
      ...(orderSn && { orderSn: { contains: orderSn } }),
      ...(userId && { userId }),
      ...(status !== undefined && { status: status as unknown as PrismaOrderStatus }),
      ...(paymentStatus !== undefined && { paymentStatus: paymentStatus as unknown as PrismaPaymentStatus }),
      ...(shippingStatus !== undefined && { shippingStatus: shippingStatus as unknown as PrismaShippingStatus }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [orders, total] = await Promise.all([
      this.databaseService.order.findMany({
        where,
        orderBy: {
          [sortField]: sortOrder,
        },
        skip: (page - 1) * size,
        take: size,
        include: {
          items: true,
          addresses: true,
          user: {
            select: {
              userId: true,
              email: true,
            },
          },
        },
      }),
      this.databaseService.order.count({ where }),
    ]);

    return {
      records: orders,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 查询单个订单
   * @param orderId 订单ID
   * @returns 订单信息
   */
  async findOne(orderId: number) {
    const order = await this.databaseService.order.findUnique({
      where: { orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        addresses: true,
        user: true,
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
   * @param reason 取消原因
   * @returns 取消后的订单信息
   */
  async cancel(orderId: number, reason?: string) {
    // 检查订单是否存在
    const existingOrder = await this.databaseService.order.findUnique({
      where: { orderId },
    });

    if (!existingOrder) {
      throw new NotFoundException('订单不存在');
    }

    // 检查订单状态是否允许取消
    if (existingOrder.paymentStatus === PrismaPaymentStatus.PAID) {
      throw new BadRequestException('已支付的订单无法取消');
    }

    // 更新订单状态
    const updatedOrder = await this.databaseService.order.update({
      where: { orderId },
      data: {
        status: PrismaOrderStatus.CANCELLED,
        cancelReason: reason,
        cancelTime: new Date(),
      },
    });

    return updatedOrder;
  }

  /**
   * 确认订单
   * @param orderId 订单ID
   * @returns 确认结果
   */
  async confirm(orderId: number) {
    const order = await this.databaseService.order.update({
      where: { orderId },
      data: { status: PrismaOrderStatus.CONFIRMED },
    });

    return { message: '订单确认成功', order };
  }

  /**
   * 发货
   * @param orderId 订单ID
   * @param shippingData 发货数据
   * @returns 发货结果
   */
  async ship(orderId: number, shippingData: { logisticsId?: number; trackingNo: string; logisticsName?: string }) {
    const order = await this.databaseService.order.update({
      where: { orderId },
      data: {
        shippingStatus: PrismaShippingStatus.SHIPPED,
        shippingTime: new Date(),
      },
    });

    return { message: '订单发货成功', order };
  }

  /**
   * 收货
   * @param orderId 订单ID
   * @returns 收货结果
   */
  async receive(orderId: number) {
    const order = await this.databaseService.order.update({
      where: { orderId },
      data: {
        shippingStatus: PrismaShippingStatus.DELIVERED,
        receiveTime: new Date(),
      },
    });

    return { message: '订单收货成功', order };
  }

  /**
   * 删除订单
   * @param orderId 订单ID
   * @returns 删除结果
   */
  async remove(orderId: number) {
    await this.databaseService.order.delete({
      where: { orderId },
    });

    return { message: '订单删除成功' };
  }

  /**
   * 恢复订单
   * @param orderId 订单ID
   * @returns 恢复结果
   */
  async restore(orderId: number) {
    const order = await this.databaseService.order.update({
      where: { orderId },
      data: { status: PrismaOrderStatus.PENDING },
    });

    return { message: '订单恢复成功', order };
  }

  /**
   * 获取订单统计
   * @param timeRange 时间范围
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 统计数据
   */
  async getStatistics(timeRange?: 'day' | 'week' | 'month' | 'year', startDate?: string, endDate?: string) {
    const query = `
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as orderCount,
        SUM(totalAmount) as totalAmount
      FROM orders
      WHERE createdAt BETWEEN ? AND ?
      GROUP BY DATE(createdAt)
      ORDER BY date
    `;

    const stats = await this.databaseService.$queryRawUnsafe(query, startDate, endDate);
    return stats;
  }
}