// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateUserRechargeOrderDto,
  UpdateUserRechargeOrderDto,
  UserRechargeOrderQueryDto,
  RechargeOrderStatus,
  PaymentType,
  RechargeOrderStatisticsDto,
  UserRechargeOrderConfigDto,
} from "./dto/user-recharge-order.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable as Inj } from "@nestjs/common";

@Injectable()
export class UserRechargeOrderService {
  constructor(private readonly prisma: PrismaService) {}

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
      // 当前表结构无 order_sn/admin_remark 字段；仅支持 postscript 模糊 + 数字关键词匹配ID类字段
      const kwNum = Number(keyword);
      const or: any[] = [{ postscript: { contains: keyword } }];
      if (!Number.isNaN(kwNum) && kwNum > 0) {
        or.push({ order_id: kwNum });
        or.push({ user_id: kwNum });
      }
      where.OR = or;
    }

    if (status !== undefined) {
      // schema uses Boolean: 已支付 => true，其它 => false
      where.status = Number(status) === (RechargeOrderStatus.PAID as number);
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
    const [rows, total] = await Promise.all([
      this.prisma.user_recharge_order.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.user_recharge_order.count({ where }),
    ]);

    // 手动补全用户信息
    const userIds = Array.from(
      new Set(rows.map((r) => r.user_id).filter((v) => !!v)),
    );
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { user_id: { in: userIds } },
          select: { user_id: true, username: true, email: true, mobile: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.user_id, u]));

    const records = rows.map((r) => ({
      ...r,
      user: userMap.get(r.user_id) || null,
      username: userMap.get(r.user_id)?.username || "",
    }));

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
    });

    if (!order) {
      throw new NotFoundException("充值订单不存在");
    }

    const user = await this.prisma.user.findUnique({
      where: { user_id: order.user_id },
      select: { user_id: true, username: true, email: true, mobile: true },
    });
    return { ...order, user: user || null, username: user?.username || "" };
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

    // 现有表无 order_sn/payment_type/admin 字段；对齐现有 schema 字段
    const now = Math.floor(Date.now() / 1000);
    const isPaid =
      createDto.status !== undefined
        ? Number(createDto.status) === (RechargeOrderStatus.PAID as number)
        : false;

    const created = await this.prisma.user_recharge_order.create({
      data: {
        user_id: createDto.userId,
        amount: createDto.amount,
        discount_money: 0,
        add_time: now,
        paid_time: isPaid ? now : 0,
        postscript: createDto.postscript || "",
        status: isPaid ? true : false,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { user_id: created.user_id },
      select: { user_id: true, username: true, email: true, mobile: true },
    });

    return { ...created, user: user || null, username: user?.username || "" };
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
      const toPaid = Number(updateDto.status) === (RechargeOrderStatus.PAID as number);
      const wasPaid = !!order.status;
      updateData.status = toPaid ? true : false;

      // 如果状态变更为已支付，记录支付时间
      if (toPaid && !wasPaid) {
        updateData.paid_time = Math.floor(Date.now() / 1000);
        // TODO: 增加用户余额（需要事务）
      }
    }

    if (updateDto.postscript !== undefined) {
      updateData.postscript = updateDto.postscript;
    }

    // 现有表结构无 paymentType/tradeNo/adminRemark 字段；忽略之

    if (updateDto.paymentTime !== undefined) {
      updateData.paid_time = Math.floor(
        new Date(updateDto.paymentTime).getTime() / 1000,
      );
    }

    const updatedOrder = await this.prisma.user_recharge_order.update({
      where: { order_id: id },
      data: updateData,
    });

    const user = await this.prisma.user.findUnique({
      where: { user_id: updatedOrder.user_id },
      select: { user_id: true, username: true, email: true, mobile: true },
    });

    return { ...updatedOrder, user: user || null, username: user?.username || "" };
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

    // 已支付订单不能删除（status=true 即已支付）
    if (order.status === true) {
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
    // 检查是否有已支付的订单（status=true）
    const paidOrders = await this.prisma.user_recharge_order.findMany({
      where: {
        order_id: { in: ids },
        status: true,
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
        // schema 使用 Boolean 状态：已支付 => true，其他 => false
        where.status = Number(queryDto.status) === (RechargeOrderStatus.PAID as number);
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
      where: { ...where, status: true },
      _sum: { amount: true },
      _count: true,
    });

    const pendingResult = await this.prisma.user_recharge_order.aggregate({
      where: { ...where, status: false },
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
    // 兼容方法占位：当前表结构无 order_sn 字段
    throw new NotFoundException("订单不存在");
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

    // 只有待支付的订单可以取消：status=false 才是待支付
    if (order.status === true) {
      throw new BadRequestException("只有待支付的订单可以取消");
    }

    if (userId && order.user_id !== userId) {
      throw new BadRequestException("无权限操作此订单");
    }

    await this.prisma.user_recharge_order.update({
      where: { order_id: id },
      data: { status: false },
    });
  }

  /**
   * 兼容 PHP：充值申请（根据设置或直接金额创建/更新）
   * @param id 设置ID或已有订单ID（此处按“设置ID”理解：当 >0 时以该设置金额创建新订单）
   * @param amount 金额（当 id=0 时，使用自定义金额）
   * @param userId 当前用户
   * @returns order_id
   */
  async rechargeOperation(id: number, amount: number, userId: number): Promise<number> {
    let finalAmount = amount;
    if (id && id > 0) {
      // 查找充值设置
      const setting = await this.prisma.recharge_setting.findUnique({ where: { recharge_id: id } });
      if (!setting) {
        throw new BadRequestException("充值设置不存在");
      }
      finalAmount = Number(setting.money || 0);
    }
    if (!finalAmount || finalAmount <= 0) {
      throw new BadRequestException("充值金额必须大于0");
    }

    const now = Math.floor(Date.now() / 1000);
    const created = await this.prisma.user_recharge_order.create({
      data: {
        user_id: userId,
        amount: finalAmount,
        discount_money: 0,
        add_time: now,
        paid_time: 0,
        postscript: "",
        status: false,
      },
    });
    return created.order_id;
  }

  /**
   * 兼容 PHP：创建充值支付，返回模拟第三方支付参数
   */
  async createRechargePayment(params: { orderId: number; payType: string; userId: number; code?: string }) {
    const { orderId, payType, userId } = params;
    const order = await this.prisma.user_recharge_order.findUnique({ where: { order_id: orderId } });
    if (!order || order.user_id !== userId) {
      throw new NotFoundException("订单不存在");
    }
    if (order.status === true) {
      return { error: true, message: "订单已支付" };
    }
    const unsupported = ["offline"];
    if (unsupported.includes(payType)) {
      return { error: true, message: "未选择支付方式" };
    }
    // 模拟创建支付日志
    const payInfo = await this.mockThirdPay(payType, order.amount);
    return {
      order_id: orderId,
      order_amount: order.amount,
      pay_info: payInfo,
    };
  }

  private async mockThirdPay(payType: string, amount: number) {
    switch (payType) {
      case "wechat":
        return {
          appId: "mock_app_id",
          timeStamp: Math.floor(Date.now() / 1000),
          nonceStr: Math.random().toString(36).slice(2),
          package: `prepay_id=${Date.now()}`,
          signType: "MD5",
          paySign: "mock_sign",
        };
      case "alipay":
        return { orderString: "mock_alipay_order_string" };
      case "paypal":
        return { approvalLink: "https://paypal.example/approve/mock" };
      default:
        throw new BadRequestException("不支持的支付方式");
    }
  }
}
