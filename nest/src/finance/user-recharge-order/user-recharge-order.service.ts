// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import {
  CreateUserRechargeOrderDto,
  UpdateUserRechargeOrderDto,
  UserRechargeOrderQueryDto,
  RechargeOrderStatus,
  PaymentType,
  RechargeOrderStatisticsDto,
  UserRechargeOrderConfigDto,
} from "./dto/user-recharge-order.dto";

@Injectable()
export class UserRechargeOrderService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 获取充值订单列表
   * @param queryDto 查询参数
   * @returns 充值订单列表和总数
   */
  async findAll(queryDto: UserRechargeOrderQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      userId,
      paymentType,
      sortField = "order_id",
      sortOrder = "desc",
      startTime,
      endTime,
    } = queryDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = {};

    if (keyword) {
      where.OR = [
        { order_sn: { contains: keyword } },
        { postscript: { contains: keyword } },
        { admin_remark: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (userId) {
      where.user_id = userId;
    }

    if (paymentType) {
      where.payment_type = paymentType;
    }

    // 时间范围查询
    if (startTime || endTime) {
      where.add_time = {};
      if (startTime) {
        where.add_time.gte = Math.floor(new Date(startTime).getTime() / 1000);
      }
      if (endTime) {
        where.add_time.lte = Math.floor(new Date(endTime).getTime() / 1000);
      }
    }

    // 构建排序
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    // 查询数据
    const [records, total] = await Promise.all([
      this.prisma.user_recharge_order.findMany({
        where,
        skip,
        take: size,
        orderBy,
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              mobile: true,
            },
          },
          admin: {
            select: {
              admin_id: true,
              username: true,
            },
          },
        },
      }),
      this.prisma.user_recharge_order.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 根据ID获取充值订单详情
   * @param id 订单ID
   * @returns 订单详情
   */
  async findById(id: number) {
    const order = await this.prisma.user_recharge_order.findUnique({
      where: { order_id: id },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        admin: {
          select: {
            admin_id: true,
            username: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("充值订单不存在");
    }

    return order;
  }

  /**
   * 创建充值订单
   * @param createDto 创建数据
   * @returns 创建的订单信息
   */
  async create(createDto: CreateUserRechargeOrderDto) {
    if (createDto.amount <= 0) {
      throw new BadRequestException("充值金额必须大于0");
    }

    // 生成订单号
    const orderSn = this.generateOrderSn();

    const order = await this.prisma.user_recharge_order.create({
      data: {
        user_id: createDto.userId,
        order_sn: orderSn,
        amount: createDto.amount,
        postscript: createDto.postscript || "",
        status: createDto.status || RechargeOrderStatus.PENDING,
        payment_type: createDto.paymentType,
        admin_id: createDto.adminId,
        add_time: Math.floor(Date.now() / 1000),
      },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        admin: {
          select: {
            admin_id: true,
            username: true,
          },
        },
      },
    });

    return order;
  }

  /**
   * 更新充值订单
   * @param id 订单ID
   * @param updateDto 更新数据
   * @returns 更新后的订单信息
   */
  async update(id: number, updateDto: UpdateUserRechargeOrderDto) {
    const order = await this.prisma.user_recharge_order.findUnique({
      where: { order_id: id },
    });

    if (!order) {
      throw new NotFoundException("充值订单不存在");
    }

    const updateData: any = {};

    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;

      // 如果状态变更为已支付，记录支付时间
      if (
        updateDto.status === RechargeOrderStatus.PAID &&
        order.status !== RechargeOrderStatus.PAID
      ) {
        updateData.payment_time = Math.floor(Date.now() / 1000);

        // 增加用户余额（这里需要事务处理）
        // TODO: 实现余额增加逻辑
      }
    }

    if (updateDto.postscript !== undefined) {
      updateData.postscript = updateDto.postscript;
    }

    if (updateDto.paymentType !== undefined) {
      updateData.payment_type = updateDto.paymentType;
    }

    if (updateDto.paymentTime !== undefined) {
      updateData.payment_time = Math.floor(
        new Date(updateDto.paymentTime).getTime() / 1000,
      );
    }

    if (updateDto.tradeNo !== undefined) {
      updateData.trade_no = updateDto.tradeNo;
    }

    if (updateDto.adminRemark !== undefined) {
      updateData.admin_remark = updateDto.adminRemark;
    }

    const updatedOrder = await this.prisma.user_recharge_order.update({
      where: { order_id: id },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        admin: {
          select: {
            admin_id: true,
            username: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * 删除充值订单
   * @param id 订单ID
   */
  async delete(id: number) {
    const order = await this.prisma.user_recharge_order.findUnique({
      where: { order_id: id },
    });

    if (!order) {
      throw new NotFoundException("充值订单不存在");
    }

    // 只有待支付和已取消的订单可以删除
    if (order.status === RechargeOrderStatus.PAID) {
      throw new BadRequestException("已支付的订单不能删除");
    }

    await this.prisma.user_recharge_order.delete({
      where: { order_id: id },
    });
  }

  /**
   * 批量删除充值订单
   * @param ids 订单ID数组
   */
  async batchDelete(ids: number[]) {
    // 检查是否有已支付的订单
    const paidOrders = await this.prisma.user_recharge_order.findMany({
      where: {
        order_id: { in: ids },
        status: RechargeOrderStatus.PAID,
      },
    });

    if (paidOrders.length > 0) {
      throw new BadRequestException("已支付的订单不能删除");
    }

    await this.prisma.user_recharge_order.deleteMany({
      where: { order_id: { in: ids } },
    });
  }

  /**
   * 获取配置信息
   * @returns 配置信息
   */
  async getConfig(): Promise<UserRechargeOrderConfigDto> {
    return {
      statusConfig: {
        [RechargeOrderStatus.PENDING]: "待支付",
        [RechargeOrderStatus.PAID]: "已支付",
        [RechargeOrderStatus.CANCELLED]: "已取消",
        [RechargeOrderStatus.REFUNDED]: "已退款",
      },
      paymentTypeConfig: {
        [PaymentType.ALIPAY]: "支付宝",
        [PaymentType.WECHAT]: "微信支付",
        [PaymentType.BALANCE]: "余额支付",
        [PaymentType.BANK]: "银行转账",
      },
      minAmount: 0.01,
      maxAmount: 100000,
    };
  }

  /**
   * 获取充值统计信息
   * @param queryDto 查询参数
   * @returns 统计信息
   */
  async getStatistics(
    queryDto?: UserRechargeOrderQueryDto,
  ): Promise<RechargeOrderStatisticsDto> {
    const where: any = {};

    if (queryDto) {
      if (queryDto.status !== undefined) {
        where.status = queryDto.status;
      }
      if (queryDto.userId) {
        where.user_id = queryDto.userId;
      }
      if (queryDto.startTime || queryDto.endTime) {
        where.add_time = {};
        if (queryDto.startTime) {
          where.add_time.gte = Math.floor(
            new Date(queryDto.startTime).getTime() / 1000,
          );
        }
        if (queryDto.endTime) {
          where.add_time.lte = Math.floor(
            new Date(queryDto.endTime).getTime() / 1000,
          );
        }
      }
    }

    // 总统计
    const totalResult = await this.prisma.user_recharge_order.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    const successResult = await this.prisma.user_recharge_order.aggregate({
      where: { ...where, status: RechargeOrderStatus.PAID },
      _sum: { amount: true },
      _count: true,
    });

    const pendingResult = await this.prisma.user_recharge_order.aggregate({
      where: { ...where, status: RechargeOrderStatus.PENDING },
      _sum: { amount: true },
      _count: true,
    });

    // 今日统计
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayResult = await this.prisma.user_recharge_order.aggregate({
      where: {
        ...where,
        add_time: {
          gte: Math.floor(todayStart.getTime() / 1000),
          lte: Math.floor(todayEnd.getTime() / 1000),
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalAmount: totalResult._sum.amount || 0,
      successAmount: successResult._sum.amount || 0,
      pendingAmount: pendingResult._sum.amount || 0,
      totalCount: totalResult._count,
      successCount: successResult._count,
      pendingCount: pendingResult._count,
      todayAmount: todayResult._sum.amount || 0,
      todayCount: todayResult._count,
    };
  }

  /**
   * 获取用户的充值订单历史
   * @param userId 用户ID
   * @param queryDto 查询参数
   * @returns 用户充值订单历史
   */
  async getUserRechargeHistory(
    userId: number,
    queryDto: UserRechargeOrderQueryDto,
  ) {
    const modifiedQuery = { ...queryDto, userId };
    return this.findAll(modifiedQuery);
  }

  /**
   * 根据订单号查询订单
   * @param orderSn 订单号
   * @returns 订单信息
   */
  async findByOrderSn(orderSn: string) {
    const order = await this.prisma.user_recharge_order.findUnique({
      where: { order_sn: orderSn },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("订单不存在");
    }

    return order;
  }

  /**
   * 生成订单号
   * @returns 订单号
   */
  private generateOrderSn(): string {
    const date = new Date();
    const dateStr =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0");
    const timeStr =
      date.getHours().toString().padStart(2, "0") +
      date.getMinutes().toString().padStart(2, "0") +
      date.getSeconds().toString().padStart(2, "0");
    const randomStr = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

    return `RC${dateStr}${timeStr}${randomStr}`;
  }

  /**
   * 取消订单
   * @param id 订单ID
   * @param userId 用户ID（可选）
   */
  async cancelOrder(id: number, userId?: number) {
    const order = await this.prisma.user_recharge_order.findUnique({
      where: { order_id: id },
    });

    if (!order) {
      throw new NotFoundException("订单不存在");
    }

    if (order.status !== RechargeOrderStatus.PENDING) {
      throw new BadRequestException("只有待支付的订单可以取消");
    }

    if (userId && order.user_id !== userId) {
      throw new BadRequestException("无权限操作此订单");
    }

    await this.prisma.user_recharge_order.update({
      where: { order_id: id },
      data: { status: RechargeOrderStatus.CANCELLED },
    });
  }
}
