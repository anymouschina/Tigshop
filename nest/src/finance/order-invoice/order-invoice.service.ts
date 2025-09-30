// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
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
      // 由于没有 Prisma 关系，无法在 where 中嵌套 user 条件，这里仅对可用字段模糊
      where.OR = [
        { company_name: { contains: keyword } },
        { invoice_no: { contains: keyword } },
        { email: { contains: keyword } },
        { mobile: { contains: keyword } },
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

    const rawRecords = await this.prisma.orderInvoice.findMany({
      where,
      skip,
      take: size,
      orderBy,
    });

    // 手动补全用户与订单信息
    const userIds = Array.from(
      new Set(rawRecords.map((r: any) => r.user_id).filter(Boolean)),
    );
    const orderIds = Array.from(
      new Set(rawRecords.map((r: any) => r.order_id).filter(Boolean)),
    );

    let userMap: Record<number, any> = {};
    if (userIds.length) {
      const users = await this.prisma.user.findMany({
        where: { user_id: { in: userIds } },
        select: { user_id: true, username: true, mobile: true, email: true },
      });
      userMap = users.reduce((acc: any, u: any) => {
        acc[u.user_id] = u;
        return acc;
      }, {} as Record<number, any>);
    }

    let orderMap: Record<number, any> = {};
    if (orderIds.length) {
      const orders = await this.prisma.order.findMany({
        where: { order_id: { in: orderIds } },
        select: { order_id: true, order_sn: true, total_amount: true },
      });
      orderMap = orders.reduce((acc: any, o: any) => {
        acc[o.order_id] = o;
        return acc;
      }, {} as Record<number, any>);
    }

    return rawRecords.map((r: any) => ({
      ...r,
      user: userMap[r.user_id] || null,
      order: orderMap[r.order_id] || null,
    }));
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
        { company_name: { contains: keyword } },
        { invoice_no: { contains: keyword } },
        { email: { contains: keyword } },
        { mobile: { contains: keyword } },
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
    const item = await this.prisma.orderInvoice.findUnique({ where: { id } });

    if (!item) {
      throw new Error("发票申请不存在");
    }

    const user = await this.prisma.user.findUnique({
      where: { user_id: item.user_id },
      select: { user_id: true, username: true, mobile: true, email: true },
    });
    const order = await this.prisma.order.findUnique({
      where: { order_id: item.order_id },
      select: { order_id: true, order_sn: true, total_amount: true },
    });

    return { ...item, user: user || null, order: order || null };
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
    // 映射字段到实际表结构
    return this.prisma.orderInvoice.create({
      data: {
        user_id: createData.user_id,
        order_id: createData.order_id,
        invoice_type: createData.invoice_type,
        // 发票抬头与公司信息
        company_name: createData.invoice_title || "",
        company_code: createData.tax_no || "",
        company_address: createData.address || "",
        company_phone: createData.phone || "",
        company_bank: createData.bank_name || "",
        company_account: createData.bank_account || "",
        amount: createData.amount,
        status: 0, // 待审核
        add_time: Math.floor(Date.now() / 1000),
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
    const raw = await this.prisma.orderInvoice.findMany({
      where: { user_id: userId },
      orderBy: { add_time: "desc" },
    });
    const orderIds = Array.from(new Set(raw.map((r: any) => r.order_id)));
    let orderMap: Record<number, any> = {};
    if (orderIds.length) {
      const orders = await this.prisma.order.findMany({
        where: { order_id: { in: orderIds } },
        select: { order_id: true, order_sn: true, total_amount: true },
      });
      orderMap = orders.reduce((acc: any, o: any) => {
        acc[o.order_id] = o;
        return acc;
      }, {} as Record<number, any>);
    }
    return raw.map((r: any) => ({ ...r, order: orderMap[r.order_id] || null }));
  }

  async getInvoicesByOrder(orderId: number) {
    return this.prisma.orderInvoice.findMany({
      where: { order_id: orderId },
      orderBy: { add_time: "desc" },
    });
  }
}
