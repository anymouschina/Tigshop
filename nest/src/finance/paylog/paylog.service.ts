// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

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
      payment_code,
      start_time,
      end_time,
    } = filter;

    const skip = (page - 1) * size;
    const sortKey =
      !sort_field || sort_field === "id" ? "paylog_id" : sort_field;
    const orderBy: any = { [sortKey]: sort_order };

    const where: any = {};
    if (keyword) {
      where.OR = [
        { pay_sn: { contains: keyword } },
        { order_sn: { contains: keyword } },
        { transaction_id: { contains: keyword } },
      ];
    }
    if (pay_status !== -1) {
      where.pay_status = parseInt(pay_status);
    }
    if (order_id) {
      where.order_id = parseInt(order_id);
    }
    if (payment_code) {
      where.pay_code = payment_code;
    }
    if (start_time || end_time) {
      where.add_time = {};
      if (start_time)
        where.add_time.gte = Math.floor(new Date(start_time).getTime() / 1000);
      if (end_time)
        where.add_time.lte = Math.floor(new Date(end_time).getTime() / 1000);
    }
    const records = await this.prisma.paylog.findMany({
      where,
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
      payment_code,
      start_time,
      end_time,
    } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { pay_sn: { contains: keyword } },
        { order_sn: { contains: keyword } },
        { transaction_id: { contains: keyword } },
      ];
    }
    if (pay_status !== -1) {
      where.pay_status = parseInt(pay_status);
    }
    if (order_id) {
      where.order_id = parseInt(order_id);
    }
    if (payment_code) {
      where.pay_code = payment_code;
    }
    if (start_time || end_time) {
      where.add_time = {};
      if (start_time)
        where.add_time.gte = Math.floor(new Date(start_time).getTime() / 1000);
      if (end_time)
        where.add_time.lte = Math.floor(new Date(end_time).getTime() / 1000);
    }

    return this.prisma.paylog.count({ where });
  }

  async getDetail(id: number) {
    const item = await this.prisma.paylog.findUnique({
      where: { paylog_id: id },
    });

    if (!item) {
      throw new Error("交易日志不存在");
    }

    return item;
  }

  async deletePaylog(id: number) {
    return this.prisma.paylog.delete({
      where: { paylog_id: id },
    });
  }

  async batchDeletePaylog(ids: number[]) {
    return this.prisma.paylog.deleteMany({
      where: { paylog_id: { in: ids } },
    });
  }

  async getPayStatistics() {
    const [total, success, failed, totalAmount] = await Promise.all([
      this.prisma.paylog.count(),
      this.prisma.paylog.count({ where: { pay_status: 1 } }),
      this.prisma.paylog.count({ where: { pay_status: 0 } }),
      this.prisma.paylog.aggregate({
        where: { pay_status: 1 },
        _sum: { pay_amount: true },
      }),
    ]);

    return {
      total,
      success,
      failed,
      total_amount: totalAmount._sum.pay_amount || 0,
      success_rate: total > 0 ? ((success / total) * 100).toFixed(2) : 0,
    };
  }

  async getPaymentMethodStats() {
    const stats = await this.prisma.paylog.groupBy({
      by: ["pay_code"],
      _count: {
        pay_code: true,
      },
      _sum: {
        pay_amount: true,
      },
    });

    return stats.map((stat) => ({
      payment_code: stat.pay_code,
      count: stat._count.pay_code,
      amount: stat._sum.pay_amount || 0,
    }));
  }

  async createPayLog(data: any) {
    return this.prisma.paylog.create({
      data: {
        user_id: data.user_id,
        order_id: data.order_id,
        pay_code: data.payment_code,
        transaction_id: data.transaction_id,
        pay_amount: data.amount,
        pay_status: data.pay_status || 0,
        add_time: Math.floor(Date.now() / 1000),
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

    return this.prisma.paylog.update({
      where: { paylog_id: paylogId },
      data: updateData,
    });
  }
}
