// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  RefundLogQueryDto,
  RefundLogDetailDto,
  CreateRefundLogDto,
  UpdateRefundLogDto,
  DeleteRefundLogDto,
  BatchDeleteRefundLogDto,
  REFUND_LOG_TYPE,
  REFUND_LOG_STATUS,
} from "./refund-log.dto";

@Injectable()
export class RefundLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: RefundLogQueryDto) {
    const {
      keyword = "",
      order_id = 0,
      user_id = 0,
      refund_apply_id = 0,
      refund_type = -1,
      status = -1,
      page = 1,
      size = 15,
      sort_field = "id",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { refund_note: { contains: keyword } },
        { admin_remark: { contains: keyword } },
        { payment_voucher: { contains: keyword } },
        { order: { order_sn: { contains: keyword } } },
        { user: { nickname: { contains: keyword } } },
      ];
    }

    if (order_id > 0) {
      where.order_id = order_id;
    }

    if (user_id > 0) {
      where.user_id = user_id;
    }

    if (refund_apply_id > 0) {
      where.refund_apply_id = refund_apply_id;
    }

    if (refund_type >= 0) {
      where.refund_type = refund_type;
    }

    if (status >= 0) {
      where.status = status;
    }

    const orderBy = {};
    orderBy[sort_field] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.refundLog.findMany({
        where,
        include: {
          user: {
            select: {
              user_id: true,
              nickname: true,
              avatar: true,
              mobile: true,
            },
          },
          order: {
            select: {
              order_id: true,
              order_sn: true,
              order_amount: true,
              pay_time: true,
            },
          },
          refund_apply: {
            select: {
              id: true,
              refund_amount: true,
              refund_reason: true,
              status: true,
            },
          },
        },
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.refundLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const refundLog = await this.prisma.refundLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            user_id: true,
            nickname: true,
            avatar: true,
            mobile: true,
            email: true,
          },
        },
        order: {
          select: {
            order_id: true,
            order_sn: true,
            order_amount: true,
            pay_time: true,
            shipping_time: true,
            confirm_time: true,
          },
        },
        refund_apply: {
          select: {
            id: true,
            refund_amount: true,
            refund_reason: true,
            status: true,
            create_time: true,
          },
        },
      },
    });

    if (!refundLog) {
      throw new Error("退款记录不存在");
    }

    return refundLog;
  }

  async create(data: CreateRefundLogDto) {
    // 检查订单是否存在
    const order = await this.prisma.order.findUnique({
      where: { order_id: data.order_id },
    });

    if (!order) {
      throw new Error("订单不存在");
    }

    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { user_id: data.user_id },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 检查退款申请是否存在（如果提供了）
    if (data.refund_apply_id > 0) {
      const refundApply = await this.prisma.refundApply.findUnique({
        where: { id: data.refund_apply_id },
      });

      if (!refundApply) {
        throw new Error("退款申请不存在");
      }
    }

    // 检查退款金额不能为负数
    if (data.refund_amount < 0) {
      throw new Error("退款金额不能为负数");
    }

    const refundLog = await this.prisma.refundLog.create({
      data: {
        ...data,
        create_time: new Date(),
        update_time: new Date(),
        status: 0, // 默认待处理
      },
    });

    return refundLog;
  }

  async update(data: UpdateRefundLogDto) {
    const refundLog = await this.prisma.refundLog.findUnique({
      where: { id: data.id },
    });

    if (!refundLog) {
      throw new Error("退款记录不存在");
    }

    // 状态变更检查
    if (data.status !== undefined && data.status !== refundLog.status) {
      // 只有待处理状态可以变为退款成功、退款失败或已取消
      if (refundLog.status === 0) {
        if (data.status === 1 || data.status === 2 || data.status === 3) {
          // 允许状态变更
        } else {
          throw new Error("无效的状态变更");
        }
      }
      // 其他状态不允许变更
      else {
        throw new Error("当前状态不允许变更");
      }
    }

    const updateData: any = {
      ...data,
      update_time: new Date(),
    };

    // 移除id字段，不允许更新ID
    delete updateData.id;

    const updatedRefundLog = await this.prisma.refundLog.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedRefundLog;
  }

  async remove(id: number) {
    const refundLog = await this.prisma.refundLog.findUnique({
      where: { id },
    });

    if (!refundLog) {
      throw new Error("退款记录不存在");
    }

    // 只有待处理状态可以删除
    if (refundLog.status !== 0) {
      throw new Error("只有待处理状态的退款记录可以删除");
    }

    await this.prisma.refundLog.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    // 检查是否都是待处理状态
    const refundLogs = await this.prisma.refundLog.findMany({
      where: {
        id: {
          in: ids,
        },
        status: 0, // 只有待处理状态可以删除
      },
    });

    if (refundLogs.length !== ids.length) {
      throw new Error("只能删除待处理状态的退款记录");
    }

    await this.prisma.refundLog.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getRefundLogStats() {
    const stats = await this.prisma.refundLog.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const result = {};
    for (let i = 0; i <= 3; i++) {
      result[i] = 0;
    }

    stats.forEach((stat) => {
      result[stat.status] = stat._count.status;
    });

    return result;
  }

  async getRefundLogByOrder(orderId: number) {
    return await this.prisma.refundLog.findMany({
      where: { order_id: orderId },
      include: {
        user: {
          select: {
            user_id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { create_time: "desc" },
    });
  }

  async getRefundLogByUser(userId: number) {
    return await this.prisma.refundLog.findMany({
      where: { user_id: userId },
      include: {
        order: {
          select: {
            order_id: true,
            order_sn: true,
            order_amount: true,
          },
        },
      },
      orderBy: { create_time: "desc" },
    });
  }

  async getRefundAmountStats(dateRange?: [Date, Date]) {
    const where: any = {
      status: 1, // 退款成功
    };

    if (dateRange && dateRange.length === 2) {
      where.create_time = {
        gte: dateRange[0],
        lte: dateRange[1],
      };
    }

    const result = await this.prisma.refundLog.aggregate({
      where,
      _sum: {
        refund_amount: true,
      },
      _count: {
        _all: true,
      },
    });

    return {
      total_amount: result._sum.refund_amount || 0,
      total_count: result._count._all || 0,
    };
  }
}
