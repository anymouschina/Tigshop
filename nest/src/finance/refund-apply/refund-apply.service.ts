// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  RefundApplyQueryDto,
  RefundApplyDetailDto,
  CreateRefundApplyDto,
  UpdateRefundApplyDto,
  DeleteRefundApplyDto,
  BatchDeleteRefundApplyDto,
  REFUND_APPLY_STATUS,
} from "./refund-apply.dto";

@Injectable()
export class RefundApplyService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: RefundApplyQueryDto) {
    const {
      keyword = "",
      user_id = 0,
      order_id = 0,
      status = -1,
      page = 1,
      size = 15,
      sort_field = "id",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      // refund_apply 表可用字段：refund_note/payment_voucher 等
      where.OR = [
        { refund_note: { contains: keyword } },
        { payment_voucher: { contains: keyword } },
      ];
    }

    if (user_id > 0) {
      where.user_id = user_id;
    }

    if (order_id > 0) {
      where.order_id = order_id;
    }

    if (status >= 0) {
      // 模型实际字段为 refund_status
      where.refund_status = status;
    }

  // 排序字段映射：id -> refund_id
  const sortKey = sort_field === "id" ? "refund_id" : sort_field;
  const orderBy: any = {};
  orderBy[sortKey] = sort_order;

    const skip = (page - 1) * size;

    // 字段映射：refund_apply 主键 refund_id；常见排序字段为 add_time/ refund_id
    const effectiveOrderBy = Object.keys(orderBy).length
      ? orderBy
      : { refund_id: "desc" };

    const [items, total] = await Promise.all([
      this.prisma.refund_apply.findMany({
        where,
        orderBy: effectiveOrderBy as any,
        skip,
        take: size,
      }),
      this.prisma.refund_apply.count({ where }),
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
    // 兼容传入 id，实际主键为 refund_id
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: Number(id) },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    return refund;
  }

  async create(data: CreateRefundApplyDto) {
    if (!data || data.order_id === undefined || data.order_id === null) {
      throw new Error("order_id 必填");
    }
    if (data.refund_amount === undefined || data.refund_amount === null) {
      throw new Error("refund_amount 必填");
    }

    // 检查订单是否存在（schema 中无 order_amount 字段，使用 paid_amount / total_amount）
    const order = await this.prisma.order.findUnique({ where: { order_id: Number(data.order_id) } });
    if (!order) {
      throw new Error("订单不存在");
    }

    // 可退款金额使用已支付金额 paid_amount（或 total_amount); 保守取 paid_amount
    const maxRefund = Number(order.paid_amount);
    if (Number(data.refund_amount) > maxRefund) {
      throw new Error("退款金额不能超过已支付金额");
    }

    // 检查是否已有未完成的退款申请
    const existingRefund = await this.prisma.refund_apply.findFirst({
      where: {
        order_id: data.order_id,
        refund_status: {
          in: [0, 1], // 待审核、审核通过
        },
      },
    });

    if (existingRefund) {
      throw new Error("该订单已有未完成的退款申请");
    }

    const refund = await this.prisma.refund_apply.create({
      data: {
        // 字段落盘映射
        refund_type: data.refund_type ?? 0,
        order_id: data.order_id,
        user_id: data.user_id,
        aftersale_id: data.aftersale_id ?? 0,
        refund_status: data.status ?? 0,
        add_time: Math.floor(Date.now() / 1000),
        refund_note: data.refund_note ?? "",
        online_balance: data.online_balance ?? 0,
        offline_balance: data.offline_balance ?? 0,
        // 将用户申请金额统一写入 refund_balance（旧系统里可能区分线上/线下，这里先兼容）
        refund_balance: data.refund_balance ?? data.refund_amount ?? 0,
        is_online: data.is_online ?? 0,
        is_offline: data.is_offline ?? 0,
        is_receive: data.is_receive ?? 0,
        shop_id: data.shop_id ?? 0,
        payment_voucher: data.payment_voucher ?? null,
      },
    });

    return refund;
  }

  async update(data: UpdateRefundApplyDto) {
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: Number(data.id) },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    // 状态变更检查
  if (data.status !== undefined && data.status !== refund.refund_status) {
      // 只有待审核状态可以变为审核通过或已拒绝
  if (refund.refund_status === 0) {
        if (data.status === 1 || data.status === 2) {
          // 允许状态变更
        } else {
          throw new Error("无效的状态变更");
        }
      }
      // 只有审核通过状态可以变为已取消
  else if (refund.refund_status === 1) {
        if (data.status === 3) {
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

    const updateData: any = {};
    if (data.status !== undefined) updateData.refund_status = data.status;
    if (data.refund_note !== undefined) updateData.refund_note = data.refund_note;
    if (data.payment_voucher !== undefined)
      updateData.payment_voucher = data.payment_voucher;

    // 移除id字段，不允许更新ID
  delete (updateData as any).id;

    const updatedRefund = await this.prisma.refund_apply.update({
      where: { refund_id: Number(data.id) },
      data: updateData,
    });

    return updatedRefund;
  }

  async remove(id: number) {
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: Number(id) },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    // 只有待审核状态可以删除
    if (refund.refund_status !== 0) {
      throw new Error("只有待审核状态的退款申请可以删除");
    }

    await this.prisma.refund_apply.delete({
      where: { refund_id: Number(id) },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    // 检查是否都是待审核状态
    const refunds = await this.prisma.refund_apply.findMany({
      where: {
        refund_id: {
          in: ids,
        },
        refund_status: 0, // 只有待审核状态可以删除
      },
    });

    if (refunds.length !== ids.length) {
      throw new Error("只能删除待审核状态的退款申请");
    }

    await this.prisma.refund_apply.deleteMany({
      where: {
        refund_id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getRefundStats() {
    const stats = await this.prisma.refund_apply.groupBy({
      by: ["refund_status"],
      _count: {
        _all: true,
      },
    });

    const result = {};
    for (let i = 0; i <= 3; i++) {
      result[i] = 0;
    }

    stats.forEach((stat: any) => {
      result[stat.refund_status] = stat._count._all;
    });

    return result;
  }
}
