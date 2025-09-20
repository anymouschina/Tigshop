import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户发票列表
   */
  async getUserInvoiceList(userId: number, page: number, size: number) {
    const skip = (page - 1) * size;

    const [invoices, total] = await Promise.all([
      (this.prisma as any).user_invoice.findMany({
        where: { user_id: userId },
        orderBy: { add_time: 'desc' },
        skip,
        take: size,
      }),
      (this.prisma as any).user_invoice.count({
        where: { user_id: userId },
      }),
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
   * 获取发票详情
   */
  async getInvoiceDetail(userId: number, invoiceId: number) {
    const invoice = await (this.prisma as any).user_invoice.findFirst({
      where: {
        invoice_id: invoiceId,
        user_id: userId,
      },
      include: {
        orders: {
          select: {
            order_id: true,
            order_sn: true,
            order_amount: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new HttpException('发票不存在', HttpStatus.NOT_FOUND);
    }

    return invoice;
  }

  /**
   * 创建发票
   */
  async createInvoice(userId: number, data: any) {
    // 验证订单
    const orders = await (this.prisma as any).order.findMany({
      where: {
        order_id: { in: data.order_ids },
        user_id: userId,
        pay_status: 1, // 已支付
        invoice_status: 0, // 未开票
      },
    });

    if (orders.length !== data.order_ids.length) {
      throw new HttpException('部分订单不可开票', HttpStatus.BAD_REQUEST);
    }

    // 计算发票金额
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.order_amount), 0);

    const invoice = await (this.prisma as any).user_invoice.create({
      data: {
        user_id: userId,
        invoice_type: data.invoice_type,
        title_type: data.title_type,
        invoice_title: data.invoice_title,
        tax_number: data.tax_number,
        invoice_content: data.invoice_content,
        invoice_amount: totalAmount,
        email: data.email,
        mobile: data.mobile,
        address: data.address,
        bank_name: data.bank_name,
        bank_account: data.bank_account,
        status: 0, // 待处理
        add_time: new Date(),
      },
    });

    // 关联订单（Prisma schema暂无关联表，跳过）

    // 更新订单开票状态
    await (this.prisma as any).order.updateMany({
      where: {
        order_id: { in: data.order_ids },
      },
      data: {
        invoice_status: 1, // 开票中
      },
    });

    return invoice;
  }

  /**
   * 更新发票信息
   */
  async updateInvoice(userId: number, data: any) {
    const existingInvoice = await (this.prisma as any).user_invoice.findFirst({
      where: {
        invoice_id: data.id,
        user_id: userId,
        status: 0, // 只有待处理的发票可以修改
      },
    });

    if (!existingInvoice) {
      throw new HttpException('发票不存在或已处理', HttpStatus.BAD_REQUEST);
    }

    const updateData: any = {};
    if (data.invoice_type !== undefined) updateData.invoice_type = data.invoice_type;
    if (data.title_type !== undefined) updateData.title_type = data.title_type;
    if (data.invoice_title !== undefined) updateData.invoice_title = data.invoice_title;
    if (data.tax_number !== undefined) updateData.tax_number = data.tax_number;
    if (data.invoice_content !== undefined) updateData.invoice_content = data.invoice_content;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.bank_name !== undefined) updateData.bank_name = data.bank_name;
    if (data.bank_account !== undefined) updateData.bank_account = data.bank_account;

    return (this.prisma as any).user_invoice.update({
      where: { invoice_id: data.id },
      data: updateData,
    });
  }

  /**
   * 删除发票
   */
  async deleteInvoice(userId: number, invoiceId: number) {
    const invoice = await (this.prisma as any).user_invoice.findFirst({
      where: {
        invoice_id: invoiceId,
        user_id: userId,
        status: 0, // 只有待处理的发票可以删除
      },
    });

    if (!invoice) {
      throw new HttpException('发票不存在或已处理', HttpStatus.BAD_REQUEST);
    }

    // 删除发票订单关联（无关联表，跳过）

    // 删除发票
    await (this.prisma as any).user_invoice.delete({
      where: { invoice_id: invoiceId },
    });

    return { success: true };
  }

  /**
   * 获取可开票订单列表
   */
  async getAvailableOrderList(userId: number, page: number, size: number) {
    const skip = (page - 1) * size;

    const [orders, total] = await Promise.all([
      (this.prisma as any).order.findMany({
        where: {
          user_id: userId,
          pay_status: 1, // 已支付
          invoice_status: 0, // 未开票
          order_status: { not: 4 }, // 未取消
        },
        orderBy: { add_time: 'desc' },
        skip,
        take: size,
        select: {
          order_id: true,
          order_sn: true,
          order_amount: true,
          add_time: true,
        },
      }),
      (this.prisma as any).order.count({
        where: {
          user_id: userId,
          pay_status: 1,
          invoice_status: 0,
          order_status: { not: 4 },
        },
      }),
    ]);

    return {
      records: orders,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取发票内容选项
   */
  async getInvoiceContentOptions() {
    return [
      { id: 'goods_detail', name: '商品明细' },
      { id: 'goods_category', name: '商品类别' },
      { id: 'service_fee', name: '服务费' },
    ];
  }

  /**
   * 获取发票类型配置
   */
  async getInvoiceTypeConfig() {
    return {
      electronic: {
        id: 1,
        name: '电子发票',
        description: '开具电子发票，发送到邮箱',
        enabled: true,
      },
      paper: {
        id: 2,
        name: '纸质发票',
        description: '开具纸质发票，邮寄到指定地址',
        enabled: true,
      },
      vat: {
        id: 3,
        name: '增值税专用发票',
        description: '开具增值税专用发票，需要提供完整税务信息',
        enabled: true,
      },
    };
  }

  /**
   * 重新开具发票
   */
  async reissueInvoice(userId: number, invoiceId: number, reason?: string) {
    const invoice = await this.prisma.userInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        user_id: userId,
      },
    });

    if (!invoice) {
      throw new HttpException('发票不存在', HttpStatus.NOT_FOUND);
    }

    // 更新发票状态
    await (this.prisma as any).user_invoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: 2, // 重新开具中
        reissue_reason: reason,
        reissue_time: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * 邮寄发票
   */
  async mailInvoice(userId: number, invoiceId: number, address: string) {
    const invoice = await (this.prisma as any).user_invoice.findFirst({
      where: {
        invoice_id: invoiceId,
        user_id: userId,
        status: 1, // 已开具
        invoice_type: 2, // 纸质发票
      },
    });

    if (!invoice) {
      throw new HttpException('发票不存在或状态错误', HttpStatus.BAD_REQUEST);
    }

    // 更新邮寄地址和状态
    await (this.prisma as any).user_invoice.update({
      where: { invoice_id: invoiceId },
      data: {
        address,
        status: 3, // 已邮寄
        mail_time: new Date(),
      },
    });

    return { success: true };
  }
}
