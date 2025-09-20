// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  RefundApplyQueryDto,
  RefundApplyDetailDto,
  CreateRefundApplyDto,
  UpdateRefundApplyDto,
  DeleteRefundApplyDto,
  BatchDeleteRefundApplyDto,
  REFUND_APPLY_STATUS
} from './refund-apply.dto';

@Injectable()
export class RefundApplyService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: RefundApplyQueryDto) {
    const {
      keyword = '',
      user_id = 0,
      order_id = 0,
      status = -1,
      page = 1,
      size = 15,
      sort_field = 'id',
      sort_order = 'desc',
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { refund_reason: { contains: keyword } },
        { admin_remark: { contains: keyword } },
        { order: { order_sn: { contains: keyword } } },
        { user: { nickname: { contains: keyword } } },
      ];
    }

    if (user_id > 0) {
      where.user_id = user_id;
    }

    if (order_id > 0) {
      where.order_id = order_id;
    }

    if (status >= 0) {
      where.status = status;
    }

    const orderBy = {};
    orderBy[sort_field] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.refundApply.findMany({
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
        },
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.refundApply.count({ where }),
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
    const refund = await this.prisma.refundApply.findUnique({
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
      },
    });

    if (!refund) {
      throw new Error('退款申请不存在');
    }

    return refund;
  }

  async create(data: CreateRefundApplyDto) {
    // 检查订单是否存在
    const order = await this.prisma.order.findUnique({
      where: { order_id: data.order_id },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查退款金额不能超过订单金额
    if (data.refund_amount > order.order_amount) {
      throw new Error('退款金额不能超过订单金额');
    }

    // 检查是否已有未完成的退款申请
    const existingRefund = await this.prisma.refundApply.findFirst({
      where: {
        order_id: data.order_id,
        status: {
          in: [0, 1], // 待审核、审核通过
        },
      },
    });

    if (existingRefund) {
      throw new Error('该订单已有未完成的退款申请');
    }

    const refund = await this.prisma.refundApply.create({
      data: {
        ...data,
        create_time: new Date(),
        update_time: new Date(),
      },
    });

    return refund;
  }

  async update(data: UpdateRefundApplyDto) {
    const refund = await this.prisma.refundApply.findUnique({
      where: { id: data.id },
    });

    if (!refund) {
      throw new Error('退款申请不存在');
    }

    // 状态变更检查
    if (data.status !== undefined && data.status !== refund.status) {
      // 只有待审核状态可以变为审核通过或已拒绝
      if (refund.status === 0) {
        if (data.status === 1 || data.status === 2) {
          // 允许状态变更
        } else {
          throw new Error('无效的状态变更');
        }
      }
      // 只有审核通过状态可以变为已取消
      else if (refund.status === 1) {
        if (data.status === 3) {
          // 允许状态变更
        } else {
          throw new Error('无效的状态变更');
        }
      }
      // 其他状态不允许变更
      else {
        throw new Error('当前状态不允许变更');
      }
    }

    const updateData: any = {
      ...data,
      update_time: new Date(),
    };

    // 移除id字段，不允许更新ID
    delete updateData.id;

    const updatedRefund = await this.prisma.refundApply.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedRefund;
  }

  async remove(id: number) {
    const refund = await this.prisma.refundApply.findUnique({
      where: { id },
    });

    if (!refund) {
      throw new Error('退款申请不存在');
    }

    // 只有待审核状态可以删除
    if (refund.status !== 0) {
      throw new Error('只有待审核状态的退款申请可以删除');
    }

    await this.prisma.refundApply.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    // 检查是否都是待审核状态
    const refunds = await this.prisma.refundApply.findMany({
      where: {
        id: {
          in: ids,
        },
        status: 0, // 只有待审核状态可以删除
      },
    });

    if (refunds.length !== ids.length) {
      throw new Error('只能删除待审核状态的退款申请');
    }

    await this.prisma.refundApply.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getRefundStats() {
    const stats = await this.prisma.refundApply.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const result = {};
    for (let i = 0; i <= 3; i++) {
      result[i] = 0;
    }

    stats.forEach(stat => {
      result[stat.status] = stat._count.status;
    });

    return result;
  }
}
