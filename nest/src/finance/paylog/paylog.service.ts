// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class PaylogService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const {
      page,
      size,
      sort_field,
      sort_order,
      keyword,
      pay_status,
      order_id,
    } = filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    const where: any = {};
    if (keyword) {
      where.OR = [
        { user: { username: { contains: keyword } } },
        { user: { mobile: { contains: keyword } } },
        { order: { order_sn: { contains: keyword } } },
        { transaction_id: { contains: keyword } },
      ];
    }
    if (pay_status !== -1) {
      where.pay_status = parseInt(pay_status);
    }
    if (order_id) {
      where.order_id = parseInt(order_id);
    }

    const records = await this.prisma.payLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mobile: true,
          },
        },
        order: {
          select: {
            id: true,
            order_sn: true,
            order_amount: true,
          },
        },
      },
      skip,
      take: size,
      orderBy,
    });

    return records;
  }

  async getFilterCount(filter: any): Promise<number> {
    const {
      page,
      size,
      sort_field,
      sort_order,
      keyword,
      pay_status,
      order_id,
    } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { user: { username: { contains: keyword } } },
        { user: { mobile: { contains: keyword } } },
        { order: { order_sn: { contains: keyword } } },
        { transaction_id: { contains: keyword } },
      ];
    }
    if (pay_status !== -1) {
      where.pay_status = parseInt(pay_status);
    }
    if (order_id) {
      where.order_id = parseInt(order_id);
    }

    return this.prisma.payLog.count({ where });
  }

  async getDetail(id: number) {
    const item = await this.prisma.payLog.findUnique({
      where: { paylog_id: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mobile: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            order_sn: true,
            order_amount: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error("交易日志不存在");
    }

    return item;
  }

  async deletePaylog(id: number) {
    return this.prisma.payLog.delete({
      where: { paylog_id: id },
    });
  }

  async batchDeletePaylog(ids: number[]) {
    return this.prisma.payLog.deleteMany({
      where: { paylog_id: { in: ids } },
    });
  }

  async getPayStatistics() {
    const [total, success, failed, totalAmount] = await Promise.all([
      this.prisma.payLog.count(),
      this.prisma.payLog.count({ where: { pay_status: 1 } }),
      this.prisma.payLog.count({ where: { pay_status: 0 } }),
      this.prisma.payLog.aggregate({
        where: { pay_status: 1 },
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      success,
      failed,
      total_amount: totalAmount._sum.amount || 0,
      success_rate: total > 0 ? ((success / total) * 100).toFixed(2) : 0,
    };
  }

  async getPaymentMethodStats() {
    const stats = await this.prisma.payLog.groupBy({
      by: ["payment_code"],
      _count: {
        payment_code: true,
      },
      _sum: {
        amount: true,
      },
    });

    return stats.map((stat) => ({
      payment_code: stat.payment_code,
      count: stat._count.payment_code,
      amount: stat._sum.amount || 0,
    }));
  }

  async createPayLog(data: any) {
    return this.prisma.payLog.create({
      data: {
        user_id: data.user_id,
        order_id: data.order_id,
        payment_code: data.payment_code,
        transaction_id: data.transaction_id,
        amount: data.amount,
        pay_status: data.pay_status || 0,
        pay_time: data.pay_time,
        create_time: new Date(),
      },
    });
  }

  async updatePayStatus(
    paylogId: number,
    status: number,
    transactionId?: string,
  ) {
    const updateData: any = {
      pay_status: status,
    };

    if (status === 1) {
      updateData.pay_time = new Date();
    }

    if (transactionId) {
      updateData.transaction_id = transactionId;
    }

    return this.prisma.payLog.update({
      where: { paylog_id: paylogId },
      data: updateData,
    });
  }
}
