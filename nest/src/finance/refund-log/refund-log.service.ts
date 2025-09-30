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
        { refund_pay_code: { contains: keyword } },
        { transaction_id: { contains: keyword } },
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

    // refund_log 无 status 字段，忽略 status 过滤

    // 排序字段映射：id -> log_id
    const sortKey = sort_field === "id" ? "log_id" : sort_field;
    const orderBy: any = {};
    orderBy[sortKey] = sort_order;

    const skip = (page - 1) * size;

    const effectiveOrderBy = Object.keys(orderBy).length
      ? orderBy
      : { log_id: "desc" };

    const [items, total] = await Promise.all([
      this.prisma.refund_log.findMany({
        where,
        orderBy: effectiveOrderBy as any,
        skip,
        take: size,
      }),
      this.prisma.refund_log.count({ where }),
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
    const refundLog = await this.prisma.refund_log.findUnique({
      where: { log_id: Number(id) },
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
      const refundApply = await this.prisma.refund_apply.findUnique({
        where: { refund_id: data.refund_apply_id },
      });

      if (!refundApply) {
        throw new Error("退款申请不存在");
      }
    }

    // 检查退款金额不能为负数
    if (data.refund_amount < 0) {
      throw new Error("退款金额不能为负数");
    }

    const refundLog = await this.prisma.refund_log.create({
      data: {
        refund_apply_id: data.refund_apply_id ?? 0,
        refund_type: data.refund_type ?? 0,
        refund_pay_code: data.refund_pay_code ?? "",
        transaction_id: data.transaction_id ?? "",
        refund_amount: data.refund_amount ?? 0,
        add_time: Math.floor(Date.now() / 1000),
        description: data.description ?? null,
        user_id: data.user_id,
        order_id: data.order_id,
      },
    });

    return refundLog;
  }

  async update(data: UpdateRefundLogDto) {
    const refundLog = await this.prisma.refund_log.findUnique({
      where: { log_id: Number(data.id) },
    });

    if (!refundLog) {
      throw new Error("退款记录不存在");
    }

    // refund_log 表没有 status 字段，跳过状态流转检查

    const updateData: any = {};
    if (data.refund_pay_code !== undefined) updateData.refund_pay_code = data.refund_pay_code;
    if (data.transaction_id !== undefined) updateData.transaction_id = data.transaction_id;
    if (data.refund_amount !== undefined) updateData.refund_amount = data.refund_amount;
    if (data.description !== undefined) updateData.description = data.description;

    // 移除id字段，不允许更新ID
    delete (updateData as any).id;

    const updatedRefundLog = await this.prisma.refund_log.update({
      where: { log_id: Number(data.id) },
      data: updateData,
    });

    return updatedRefundLog;
  }

  async remove(id: number) {
    const refundLog = await this.prisma.refund_log.findUnique({
      where: { log_id: Number(id) },
    });

    if (!refundLog) {
      throw new Error("退款记录不存在");
    }

    await this.prisma.refund_log.delete({
      where: { log_id: Number(id) },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    await this.prisma.refund_log.deleteMany({
      where: {
        log_id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getRefundLogStats() {
    // refund_log 无状态统计字段，返回空结构或聚合退款金额
    const stats: any[] = [];

    const result = {};
    for (let i = 0; i <= 3; i++) {
      result[i] = 0;
    }

    // 无状态字段，保持默认 0

    return result;
  }

  async getRefundLogByOrder(orderId: number) {
    return await this.prisma.refund_log.findMany({
      where: { order_id: orderId },
      orderBy: { add_time: "desc" },
    });
  }

  async getRefundLogByUser(userId: number) {
    return await this.prisma.refund_log.findMany({
      where: { user_id: userId },
      orderBy: { add_time: "desc" },
    });
  }

  async getRefundAmountStats(dateRange?: [Date, Date]) {
    const where: any = {};
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      const startSec = Math.floor(start.getTime() / 1000);
      const endSec = Math.floor(end.getTime() / 1000);
      where.add_time = {
        gte: startSec,
        lte: endSec,
      };
    }

    const result = await this.prisma.refund_log.aggregate({
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
