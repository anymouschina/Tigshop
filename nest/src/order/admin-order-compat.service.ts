// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminOrderCompatService {
  private readonly logger = new Logger(AdminOrderCompatService.name);
  constructor(private readonly prisma: PrismaService) {}

  async list(query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const skip = (page - 1) * size;
    const keyword = query.keyword?.trim();
    const orderStatus = query.orderStatus ?? query.order_status;
    const payStatus = query.payStatus ?? query.pay_status;
    const shippingStatus = query.shippingStatus ?? query.shipping_status;
    const startTime = query.startTime ?? query.start_time;
    const endTime = query.endTime ?? query.end_time;

    const where: any = { is_del: 0 };
    if (keyword) {
      where.OR = [
        { order_sn: { contains: keyword } },
        { mobile: { contains: keyword } },
        { consignee: { contains: keyword } },
      ];
    }
    if (orderStatus !== undefined && orderStatus !== "") {
      where.order_status = Number(orderStatus);
    }
    if (payStatus !== undefined && payStatus !== "") {
      where.pay_status = Number(payStatus);
    }
    if (shippingStatus !== undefined && shippingStatus !== "") {
      where.shipping_status = Number(shippingStatus);
    }
    if (startTime || endTime) {
      const from = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : undefined;
      const to = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : undefined;
      where.add_time = { ...(from !== undefined && { gte: from }), ...(to !== undefined && { lte: to }) };
    }

    const [records, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { add_time: "desc" },
        skip,
        take: size,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { records, total, size, current: page, pages: Math.max(1, Math.ceil((total || 0) / size)) };
  }

  async detail(id: number) {
    const base = await this.prisma.order.findUnique({ where: { order_id: id } });
    if (!base) return null;
    const [items, logs] = await Promise.all([
      this.prisma.order_item.findMany({ where: { order_id: id } }),
      this.prisma.order_log.findMany({ where: { order_id: id }, orderBy: { log_id: "desc" } }),
    ]);
    return { ...base, items, logs };
  }

  async updateField(id: number, field: string, value: any) {
    const allowed = [
      "order_status",
      "pay_status",
      "shipping_status",
      "tracking_no",
      "admin_note",
      "logistics_id",
      "logistics_name",
    ];
    if (!allowed.includes(field)) {
      throw new Error("不支持的字段");
    }
    // 类型处理
    if (["order_status", "pay_status", "shipping_status", "logistics_id"].includes(field)) {
      if (typeof value === "string") value = parseInt(value, 10);
      if (!Number.isFinite(value)) value = 0;
    }
    await this.prisma.order.update({ where: { order_id: id }, data: { [field]: value } });
    return true;
  }

  async getLogs(orderId: number, page = 1, size = 15) {
    const skip = (page - 1) * size;
    const where = { order_id: orderId } as any;
    const [records, total] = await Promise.all([
      this.prisma.order_log.findMany({ where, orderBy: { log_id: "desc" }, skip, take: size }),
      this.prisma.order_log.count({ where }),
    ]);
    return { records, total, size, current: page, pages: Math.max(1, Math.ceil((total || 0) / size)) };
  }

  async addLog(orderId: number, content: string, adminName?: string) {
    await this.prisma.order_log.create({
      data: {
        order_id: orderId,
        content: content || "",
        add_time: Math.floor(Date.now() / 1000),
        operator: adminName || "admin",
      } as any,
    });
    return true;
  }

  async saveExportItem(adminId: number, exportItems: string[]) {
    // 预留：可落在 admin_user 表的扩展字段；当前先接受并返回成功
    this.logger.log(`saveExportItem admin=${adminId} items=${JSON.stringify(exportItems)}`);
    return true;
  }
}
