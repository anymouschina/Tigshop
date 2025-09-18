import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateOrderDto, OrderStatus, ShippingStatus, PayStatus, OrderItemDto, OrderType, PayTypeId } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { DatabaseService } from 'src/database/database.service';
import { Prisma } from '@prisma/client';

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
          shopId: createOrderDto.shopId,
          totalAmount,
          productAmount,
          shippingFee,
          discountAmount,
          balance: createOrderDto.balance,
          usePoints: createOrderDto.usePoints,
          pointsAmount: createOrderDto.pointsAmount,
          couponAmount: createOrderDto.couponAmount,
          payType: this.getPayTypeName(createOrderDto.payTypeId),
          orderType: createOrderDto.orderType,
          status: OrderStatus.PENDING,
          payStatus: PayStatus.UNPAID,
          shippingStatus: ShippingStatus.PENDING,
          consignee: createOrderDto.consignee,
          mobile: createOrderDto.mobile,
          address: createOrderDto.address,
          buyerNote: createOrderDto.buyerNote,
          invoiceData: createOrderDto.invoiceData,
          shippingType: createOrderDto.shippingType,
        },
      });

      // 创建订单项
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.orderId,
            productId: item.productId,
            skuId: item.skuId,
            productName: item.productName,
            productSn: item.productSn,
            productImage: item.productImage,
            skuValue: item.skuValue,
            quantity: item.quantity,
            price: item.price,
            productWeight: item.productWeight,
            skuData: item.skuData,
          },
        });

        // 扣减库存
        await tx.product.update({
          where: { productId: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
            sales: {
              increment: item.quantity,
            },
          },
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
    const outOfStockItems = [];

    for (const item of items) {
      const product = await this.databaseService.product.findUnique({
        where: { productId: item.productId },
      });

      if (!product || product.stock < item.quantity) {
        outOfStockItems.push({
          productId: item.productId,
          productName: item.productName,
          currentStock: product?.stock || 0,
          requiredStock: item.quantity,
        });
      }
    }

    return outOfStockItems;
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

  /**
   * 获取支付方式名称
   * @param payTypeId 支付方式ID
   * @returns 支付方式名称
   */
  private getPayTypeName(payTypeId: PayTypeId): string {
    const payTypeNames = {
      [PayTypeId.ONLINE]: '在线支付',
      [PayTypeId.CASH]: '货到付款',
      [PayTypeId.OFFLINE]: '线下支付',
    };
    return payTypeNames[payTypeId] || '在线支付';
  }

  /**
   * 更新订单状态
   * @param orderId 订单ID
   * @param updateOrderDto 更新数据
   * @returns 更新后的订单
   */
  async updateStatus(orderId: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.databaseService.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查状态转换是否有效
    if (!this.isValidStatusTransition(order.status, updateOrderDto.orderStatus)) {
      throw new BadRequestException(`无法从 ${order.status} 转换到 ${updateOrderDto.orderStatus}`);
    }

    const updateData: any = {};

    if (updateOrderDto.orderStatus !== undefined) {
      updateData.status = updateOrderDto.orderStatus;
    }

    if (updateOrderDto.payStatus !== undefined) {
      updateData.payStatus = updateOrderDto.payStatus;
    }

    if (updateOrderDto.shippingStatus !== undefined) {
      updateData.shippingStatus = updateOrderDto.shippingStatus;
    }

    if (updateOrderDto.payTime) {
      updateData.payTime = new Date(updateOrderDto.payTime);
    }

    if (updateOrderDto.shippingTime) {
      updateData.shippingTime = new Date(updateOrderDto.shippingTime);
    }

    if (updateOrderDto.receivedTime) {
      updateData.receivedTime = new Date(updateOrderDto.receivedTime);
    }

    if (updateOrderDto.completedTime) {
      updateData.completedTime = new Date(updateOrderDto.completedTime);
    }

    if (updateOrderDto.logisticsId !== undefined) {
      updateData.logisticsId = updateOrderDto.logisticsId;
    }

    if (updateOrderDto.trackingNo) {
      updateData.trackingNo = updateOrderDto.trackingNo;
    }

    if (updateOrderDto.logisticsName) {
      updateData.logisticsName = updateOrderDto.logisticsName;
    }

    if (updateOrderDto.payType) {
      updateData.payType = updateOrderDto.payType;
    }

    if (updateOrderDto.transactionId) {
      updateData.transactionId = updateOrderDto.transactionId;
    }

    if (updateOrderDto.paidAmount !== undefined) {
      updateData.paidAmount = updateOrderDto.paidAmount;
    }

    if (updateOrderDto.adminNote) {
      updateData.adminNote = updateOrderDto.adminNote;
    }

    if (updateOrderDto.orderExtension) {
      updateData.orderExtension = updateOrderDto.orderExtension;
    }

    if (updateOrderDto.addressData) {
      updateData.addressData = updateOrderDto.addressData;
    }

    if (updateOrderDto.mark !== undefined) {
      updateData.mark = updateOrderDto.mark;
    }

    const updatedOrder = await this.databaseService.order.update({
      where: { orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            userId: true,
            username: true,
            nickname: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * 检查状态转换是否有效
   * @param currentStatus 当前状态
   * @param newStatus 新状态
   * @returns 状态转换是否有效
   */
  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    // 定义状态转换规则
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.CANCELLED]: [], // 已取消状态不能再改变
      [OrderStatus.INVALID]: [], // 无效状态不能再改变
      [OrderStatus.COMPLETED]: [], // 已完成状态不能再改变
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * 查询订单列表
   * @param queryDto 查询参数
   * @returns 订单列表和总数
   */
  async findAll(queryDto: OrderQueryDto) {
    const {
      page = 1,
      size = 15,
      sortField = 'orderId',
      sortOrder = 'desc',
      keyword,
      orderId,
      userId,
      shopId,
      orderStatus,
      payStatus,
      shippingStatus,
      commentStatus,
      orderType,
      payTypeId,
      isEnable,
      minAmount,
      maxAmount,
      startTime,
      endTime,
      ids,
      consignee,
      mobile,
      dateType,
    } = queryDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = {
      isDelete: queryDto.isDelete === 0 ? 0 : { not: 0 },
    };

    if (keyword) {
      where.OR = [
        { orderSn: { contains: keyword } },
        { consignee: { contains: keyword } },
        { mobile: { contains: keyword } },
      ];
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (shopId && shopId !== -2) {
      where.shopId = shopId;
    }

    if (orderStatus !== undefined) {
      where.status = orderStatus;
    }

    if (payStatus !== undefined) {
      where.payStatus = payStatus;
    }

    if (shippingStatus !== undefined) {
      where.shippingStatus = shippingStatus;
    }

    if (commentStatus !== undefined) {
      where.commentStatus = commentStatus;
    }

    if (orderType !== undefined) {
      where.orderType = orderType;
    }

    if (payTypeId !== undefined) {
      where.payTypeId = payTypeId;
    }

    if (isEnable !== undefined) {
      where.isEnable = isEnable;
    }

    if (minAmount !== undefined) {
      where.totalAmount = { gte: minAmount };
    }

    if (maxAmount !== undefined) {
      where.totalAmount = where.totalAmount ? { ...where.totalAmount, lte: maxAmount } : { lte: maxAmount };
    }

    if (startTime) {
      where.createdAt = { gte: new Date(startTime) };
    }

    if (endTime) {
      where.createdAt = where.createdAt ? { ...where.createdAt, lte: new Date(endTime) } : { lte: new Date(endTime) };
    }

    if (consignee) {
      where.consignee = { contains: consignee };
    }

    if (mobile) {
      where.mobile = { contains: mobile };
    }

    // 构建排序条件
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    // 查询订单
    const [orders, total] = await Promise.all([
      this.databaseService.order.findMany({
        where,
        skip,
        take: size,
        orderBy,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              userId: true,
              username: true,
              nickname: true,
              email: true,
              mobile: true,
            },
          },
        },
      }),
      this.databaseService.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 根据ID查询订单
   * @param orderId 订单ID
   * @returns 订单详情
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
        user: {
          select: {
            userId: true,
            username: true,
            nickname: true,
            email: true,
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
   * @param reason 取消原因
   * @returns 取消后的订单
   */
  async cancel(orderId: number, reason?: string) {
    const order = await this.databaseService.order.findUnique({
      where: { orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查订单状态是否可以取消
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('当前订单状态无法取消');
    }

    // 使用事务处理订单取消
    const result = await this.databaseService.$transaction(async (tx) => {
      // 更新订单状态
      const updatedOrder = await tx.order.update({
        where: { orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelReason: reason || '用户取消',
          cancelledAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 恢复商品库存
      for (const item of order.items) {
        await tx.product.update({
          where: { productId: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
            sales: {
              decrement: item.quantity,
            },
          },
        });
      }

      return updatedOrder;
    });

    return result;
  }

  /**
   * 确认订单
   * @param orderId 订单ID
   * @returns 确认后的订单
   */
  async confirm(orderId: number) {
    const order = await this.databaseService.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('只有待确认的订单可以确认');
    }

    const updatedOrder = await this.databaseService.order.update({
      where: { orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    return updatedOrder;
  }

  /**
   * 发货
   * @param orderId 订单ID
   * @param shippingData 发货数据
   * @returns 发货后的订单
   */
  async ship(orderId: number, shippingData: { logisticsId?: number; trackingNo: string; logisticsName?: string }) {
    const order = await this.databaseService.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('只有已确认的订单可以发货');
    }

    const updatedOrder = await this.databaseService.order.update({
      where: { orderId },
      data: {
        status: OrderStatus.PROCESSING,
        shippingStatus: ShippingStatus.SENT,
        shippingTime: new Date(),
        logisticsId: shippingData.logisticsId,
        trackingNo: shippingData.trackingNo,
        logisticsName: shippingData.logisticsName,
      },
    });

    return updatedOrder;
  }

  /**
   * 确认收货
   * @param orderId 订单ID
   * @returns 确认收货后的订单
   */
  async receive(orderId: number) {
    const order = await this.databaseService.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('只有处理中的订单可以确认收货');
    }

    const updatedOrder = await this.databaseService.order.update({
      where: { orderId },
      data: {
        status: OrderStatus.COMPLETED,
        shippingStatus: ShippingStatus.SHIPPED,
        receivedTime: new Date(),
        completedTime: new Date(),
      },
    });

    return updatedOrder;
  }

  /**
   * 删除订单（软删除）
   * @param orderId 订单ID
   * @returns 删除结果
   */
  async remove(orderId: number) {
    const order = await this.databaseService.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const updatedOrder = await this.databaseService.order.update({
      where: { orderId },
      data: {
        isDelete: 1,
        deletedAt: new Date(),
      },
    });

    return updatedOrder;
  }

  /**
   * 恢复删除的订单
   * @param orderId 订单ID
   * @returns 恢复后的订单
   */
  async restore(orderId: number) {
    const order = await this.databaseService.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const updatedOrder = await this.databaseService.order.update({
      where: { orderId },
      data: {
        isDelete: 0,
        deletedAt: null,
      },
    });

    return updatedOrder;
  }

  /**
   * 获取订单统计信息
   * @param timeRange 时间范围
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 统计信息
   */
  async getStatistics(timeRange?: 'day' | 'week' | 'month' | 'year', startDate?: string, endDate?: string) {
    // 构建时间过滤条件
    let dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      dateFilter.createdAt = {
        lte: new Date(endDate),
      };
    } else {
      // 默认最近30天
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    // 获取基础统计
    const [totalOrders, paidOrders, cancelledOrders, completedOrders] = await Promise.all([
      this.databaseService.order.count({ where: dateFilter }),
      this.databaseService.order.count({
        where: {
          ...dateFilter,
          payStatus: PayStatus.PAID,
        },
      }),
      this.databaseService.order.count({
        where: {
          ...dateFilter,
          status: OrderStatus.CANCELLED,
        },
      }),
      this.databaseService.order.count({
        where: {
          ...dateFilter,
          status: OrderStatus.COMPLETED,
        },
      }),
    ]);

    // 获取总销售额
    const totalSales = await this.databaseService.order.aggregate({
      where: {
        ...dateFilter,
        payStatus: PayStatus.PAID,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // 按状态统计
    const statusStats = await this.databaseService.order.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: {
        status: true,
      },
    });

    // 按支付状态统计
    const payStatusStats = await this.databaseService.order.groupBy({
      by: ['payStatus'],
      where: dateFilter,
      _count: {
        payStatus: true,
      },
    });

    return {
      totalOrders,
      paidOrders,
      cancelledOrders,
      completedOrders,
      totalSales: totalSales._sum.totalAmount || 0,
      statusStats: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count.status,
      })),
      payStatusStats: payStatusStats.map(stat => ({
        payStatus: stat.payStatus,
        count: stat._count.payStatus,
      })),
      timeRange,
      startDate,
      endDate,
    };
  }
}
