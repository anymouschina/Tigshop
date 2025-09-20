// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OrderInvoiceService {
  constructor(private prisma: PrismaService) {}

  /**
   * 更新订单发票
   */
  async updateOrderInvoice(userId: number, data: any) {
    // 验证订单
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: data.order_id,
        user_id: userId,
        pay_status: 1, // 已支付
      },
    });

    if (!order) {
      throw new HttpException("订单不存在或未支付", HttpStatus.BAD_REQUEST);
    }

    const invoiceData = {
      order_id: data.order_id,
      user_id: userId,
      invoice_type: data.invoice_type || 1,
      title_type: data.title_type || 1,
      company_code: data.company_code,
      invoice_title: data.invoice_title,
      tax_number: data.tax_number,
      invoice_content: data.invoice_content,
      email: data.email,
      mobile: data.mobile,
      address: data.address,
      bank_name: data.bank_name,
      bank_account: data.bank_account,
      receiver_name: data.receiver_name,
      receiver_phone: data.receiver_phone,
      receiver_address: data.receiver_address,
      status: data.status || 0,
    };

    if (data.id) {
      // 更新
      return this.prisma.orderInvoice.update({
        where: {
          invoice_id: data.id,
          user_id: userId,
        },
        data: invoiceData,
      });
    } else {
      // 创建
      return this.prisma.orderInvoice.create({
        data: {
          ...invoiceData,
          add_time: new Date(),
        },
      });
    }
  }

  /**
   * 获取订单发票列表
   */
  async getOrderInvoiceList(userId: number, query: any) {
    const page = query.page || 1;
    const size = query.size || 10;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };
    if (query.order_id) where.order_id = query.order_id;
    if (query.status !== undefined) where.status = query.status;

    const [invoices, total] = await Promise.all([
      this.prisma.orderInvoice.findMany({
        where,
        orderBy: { add_time: "desc" },
        skip,
        take: size,
        include: {
          order: {
            select: {
              order_sn: true,
              order_amount: true,
            },
          },
        },
      }),
      this.prisma.orderInvoice.count({ where }),
    ]);

    return {
      records: invoices,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取订单发票详情
   */
  async getOrderInvoiceDetail(userId: number, invoiceId: number) {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        user_id: userId,
      },
      include: {
        order: {
          select: {
            order_sn: true,
            order_amount: true,
            pay_time: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new HttpException("订单发票不存在", HttpStatus.NOT_FOUND);
    }

    return invoice;
  }

  /**
   * 删除订单发票
   */
  async deleteOrderInvoice(userId: number, invoiceId: number) {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        user_id: userId,
        status: 0, // 只有待处理的发票可以删除
      },
    });

    if (!invoice) {
      throw new HttpException("订单发票不存在或已处理", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.orderInvoice.delete({
      where: { invoice_id: invoiceId },
    });

    return { success: true };
  }

  /**
   * 申请开具发票
   */
  async applyInvoice(userId: number, invoiceId: number) {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        user_id: userId,
        status: 0, // 只有待处理的发票可以申请
      },
    });

    if (!invoice) {
      throw new HttpException("订单发票不存在或已处理", HttpStatus.BAD_REQUEST);
    }

    // 更新发票状态为申请中
    await this.prisma.orderInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: 1, // 申请中
        apply_time: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * 获取订单发票信息
   */
  async getOrderInvoiceInfo(userId: number, orderId: number) {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
      },
    });

    return invoice || null;
  }
}
