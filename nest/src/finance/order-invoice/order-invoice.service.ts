// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import {
  CreateOrderInvoiceDto,
  UpdateOrderInvoiceDto,
} from "./dto/order-invoice.dto";

@Injectable()
export class OrderInvoiceService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const {
      page,
      size,
      sort_field,
      sort_order,
      keyword,
      invoice_type,
      status,
      shop_type,
      shop_id,
    } = filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    const where: any = {};
    if (keyword) {
      where.OR = [
        { user: { username: { contains: keyword } } },
        { user: { mobile: { contains: keyword } } },
        { invoice_title: { contains: keyword } },
        { invoice_no: { contains: keyword } },
      ];
    }
    if (invoice_type) {
      where.invoice_type = parseInt(invoice_type);
    }
    if (status !== -1) {
      where.status = parseInt(status);
    }
    if (shop_type) {
      where.shop_type = parseInt(shop_type);
    }
    if (shop_id !== -1) {
      where.shop_id = parseInt(shop_id);
    }

    const records = await this.prisma.orderInvoice.findMany({
      where,
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
      invoice_type,
      status,
      shop_type,
      shop_id,
    } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { user: { username: { contains: keyword } } },
        { user: { mobile: { contains: keyword } } },
        { invoice_title: { contains: keyword } },
        { invoice_no: { contains: keyword } },
      ];
    }
    if (invoice_type) {
      where.invoice_type = parseInt(invoice_type);
    }
    if (status !== -1) {
      where.status = parseInt(status);
    }
    if (shop_type) {
      where.shop_type = parseInt(shop_type);
    }
    if (shop_id !== -1) {
      where.shop_id = parseInt(shop_id);
    }

    return this.prisma.orderInvoice.count({ where });
  }

  async getDetail(id: number) {
    const item = await this.prisma.orderInvoice.findUnique({
      where: { id },
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
      throw new Error("发票申请不存在");
    }

    return item;
  }

  async updateOrderInvoice(id: number, updateData: UpdateOrderInvoiceDto) {
    return this.prisma.orderInvoice.update({
      where: { id },
      data: {
        status: updateData.status,
        amount: updateData.amount,
        apply_reply: updateData.apply_reply,
        invoice_attachment: updateData.invoice_attachment,
        audit_time: new Date(),
      },
    });
  }

  async deleteOrderInvoice(id: number) {
    return this.prisma.orderInvoice.delete({
      where: { id },
    });
  }

  async batchDeleteOrderInvoice(ids: number[]) {
    return this.prisma.orderInvoice.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async createOrderInvoice(createData: CreateOrderInvoiceDto) {
    return this.prisma.orderInvoice.create({
      data: {
        user_id: createData.user_id,
        order_id: createData.order_id,
        invoice_type: createData.invoice_type,
        invoice_title: createData.invoice_title,
        tax_no: createData.tax_no,
        address: createData.address,
        phone: createData.phone,
        bank_name: createData.bank_name,
        bank_account: createData.bank_account,
        amount: createData.amount,
        status: 0, // 待审核
        create_time: new Date(),
      },
    });
  }

  async getInvoiceStatistics() {
    const [total, pending, approved, rejected, totalAmount] = await Promise.all(
      [
        this.prisma.orderInvoice.count(),
        this.prisma.orderInvoice.count({ where: { status: 0 } }),
        this.prisma.orderInvoice.count({ where: { status: 1 } }),
        this.prisma.orderInvoice.count({ where: { status: 2 } }),
        this.prisma.orderInvoice.aggregate({
          _sum: { amount: true },
        }),
      ],
    );

    return {
      total,
      pending,
      approved,
      rejected,
      total_amount: totalAmount._sum.amount || 0,
    };
  }

  async getInvoicesByUser(userId: number) {
    return this.prisma.orderInvoice.findMany({
      where: { user_id: userId },
      include: {
        order: {
          select: {
            id: true,
            order_sn: true,
            order_amount: true,
          },
        },
      },
      orderBy: { create_time: "desc" },
    });
  }

  async getInvoicesByOrder(orderId: number) {
    return this.prisma.orderInvoice.findMany({
      where: { order_id: orderId },
      orderBy: { create_time: "desc" },
    });
  }
}
