// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export enum AftersalesType {
  PAY_RETURN = 2, // 仅退款
  RETURN = 1, // 退货/退款
}

export enum AftersalesStatus {
  IN_REVIEW = 1, // 审核中
  APPROVED_FOR_PROCESSING = 2, // 审核通过，处理中
  REFUSE = 3, // 拒绝
  SEND_BACK = 4, // 用户寄回
  RETURNED = 5, // 已寄回，待收货
  COMPLETE = 6, // 已完成
  CANCEL = 7, // 已取消
  WAIT_FOR_SUPPLIER_AUDIT = 21, // 等待供应商审核
  SUPPLIER_APPROVED = 22, // 供应商审核通过
  SUPPLIER_REFUSE = 23, // 供应商拒绝
}

export const AFTERSALES_TYPE_NAME = {
  [AftersalesType.PAY_RETURN]: "仅退款",
  [AftersalesType.RETURN]: "退货/退款",
};

export const STATUS_NAME = {
  [AftersalesStatus.IN_REVIEW]: "审核中",
  [AftersalesStatus.APPROVED_FOR_PROCESSING]: "审核通过，处理中",
  [AftersalesStatus.REFUSE]: "拒绝",
  [AftersalesStatus.SEND_BACK]: "用户寄回",
  [AftersalesStatus.RETURNED]: "已寄回，待收货",
  [AftersalesStatus.COMPLETE]: "已完成",
  [AftersalesStatus.CANCEL]: "已取消",
  [AftersalesStatus.WAIT_FOR_SUPPLIER_AUDIT]: "等待供应商审核",
  [AftersalesStatus.SUPPLIER_APPROVED]: "供应商审核通过",
  [AftersalesStatus.SUPPLIER_REFUSE]: "供应商拒绝",
};

export const REFUSE_REASON = [
  "已经超过七天无理由退货时限",
  "商品没有问题，买家未举证",
  "商品没有问题，买家举证无效",
  "已协商完毕不退货",
];

export const VALID_STATUS = [
  AftersalesStatus.IN_REVIEW,
  AftersalesStatus.APPROVED_FOR_PROCESSING,
  AftersalesStatus.SEND_BACK,
  AftersalesStatus.RETURNED,
  AftersalesStatus.WAIT_FOR_SUPPLIER_AUDIT,
  AftersalesStatus.SUPPLIER_APPROVED,
];

export const PROGRESSING_STATUS = [
  AftersalesStatus.IN_REVIEW,
  AftersalesStatus.APPROVED_FOR_PROCESSING,
  AftersalesStatus.SEND_BACK,
  AftersalesStatus.RETURNED,
  AftersalesStatus.WAIT_FOR_SUPPLIER_AUDIT,
  AftersalesStatus.SUPPLIER_APPROVED,
];

@Injectable()
export class AftersalesService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = await this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.aftersales.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    // 附带订单号，便于前端展示
    const orderIds = Array.from(new Set(results.map((r: any) => r.order_id).filter(Boolean)));
    const orderSnMap = new Map<number, string>();
    if (orderIds.length) {
      const orders = await this.prisma.order.findMany({
        where: { order_id: { in: orderIds as number[] } },
        select: { order_id: true, order_sn: true },
      });
      orders.forEach((o) => orderSnMap.set(o.order_id, o.order_sn));
    }

    return results.map((result: any) => ({
      ...result,
      order_sn: orderSnMap.get(result.order_id) || "",
      aftersales_type_name: this.getAftersalesTypeName(result.aftersales_type),
      status_name: this.getStatusName(result.status),
    }));
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = await this.buildWhereClause(filter);
    return this.prisma.aftersales.count({ where });
  }

  private async buildWhereClause(filter: any): Promise<any> {
    const where: any = {};

    // 申请类型筛选
    if (filter.aftersale_type && filter.aftersale_type !== 0) {
      where.aftersales_type = filter.aftersale_type;
    }

    // 店铺筛选
    if (filter.shop_id && filter.shop_id > -1) {
      where.shop_id = filter.shop_id;
    }

    // 供应商筛选
    if (filter.vendor_id && filter.vendor_id > 0) {
      where.vendor_id = filter.vendor_id;
    }

    // 时间筛选
    if (filter.add_time && filter.add_time.length === 2) {
      const [startDate, endDate] = filter.add_time;
      where.add_time = {
        gte: new Date(startDate).getTime() / 1000,
        lte: new Date(endDate).getTime() / 1000 + 86400,
      };
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    if (filter.sort_field && filter.sort_order) {
      return {
        [filter.sort_field]: filter.sort_order,
      };
    }
    return {
      aftersale_id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.aftersales.findUnique({ where: { aftersale_id: id } });
    if (!result) throw new Error("售后记录不存在");

    const items = await this.prisma.aftersales_item.findMany({ where: { aftersale_id: id } });
    const orderItemIds = items.map((it) => it.order_item_id).filter(Boolean) as number[];
    const orderItems = orderItemIds.length
      ? await this.prisma.order_item.findMany({ where: { item_id: { in: orderItemIds } } })
      : [];
    const orderItemMap = new Map(orderItems.map((oi) => [oi.item_id, oi] as const));
    const aftersales_items = items.map((it) => ({ ...it, items: orderItemMap.get(it.order_item_id as number) || null }));

    const order = result.order_id ? await this.prisma.order.findUnique({ where: { order_id: result.order_id } }) : null;
    const aftersales_log = await this.prisma.aftersales_log.findMany({ where: { aftersale_id: id }, orderBy: { log_id: "desc" } });

    let suggest = 0;
    for (const it of items) {
      const oi = orderItemMap.get(it.order_item_id as number);
      if (oi) suggest += Number(oi.price || 0) * Number(it.number || 0);
    }

    return {
      ...result,
      aftersales_items,
      order,
      aftersales_log,
      status_config: STATUS_NAME,
      aftersales_type_config: AFTERSALES_TYPE_NAME,
      refuse_reason: REFUSE_REASON,
      aftersales_type_name: this.getAftersalesTypeName(result.aftersales_type),
      status_name: this.getStatusName(result.status),
      suggest_refund_amount: parseFloat(suggest.toFixed(2)),
    };
  }

  async agreeOrRefuse(id: number, data: any): Promise<boolean> {
    const aftersales = await this.prisma.aftersales.findUnique({
      where: { aftersale_id: id },
    });

    if (!aftersales) {
      throw new Error("售后记录不存在");
    }

    const updateData: any = {
      status: data.status,
      reply: data.reply || "",
      return_address: data.return_address || "",
      refund_amount: data.refund_amount || 0,
      deal_time: Math.floor(Date.now() / 1000),
    };

    // 如果是退款操作，更新退款金额
    if (data.refund_amount > 0) {
      updateData.refund_amount = data.refund_amount;
    }

    const result = await this.prisma.aftersales.update({
      where: { aftersale_id: id },
      data: updateData,
    });

    // 记录操作日志
    await this.addLog(id, {
      admin_name: String(data.admin_name || "admin"),
      log_info:
        data.status === AftersalesStatus.APPROVED_FOR_PROCESSING
          ? "同意售后"
          : "拒绝售后",
      refund_money: Number(data.refund_amount || 0),
      refund_type: 0,
      refund_desc: data.reply || "",
    });

    return !!result;
  }

  async complete(id: number, adminId: number): Promise<boolean> {
    const aftersales = await this.prisma.aftersales.findUnique({
      where: { aftersale_id: id },
    });

    if (!aftersales) {
      throw new Error("售后记录不存在");
    }

    const result = await this.prisma.aftersales.update({
      where: { aftersale_id: id },
      data: {
        status: AftersalesStatus.COMPLETE,
        final_time: Math.floor(Date.now() / 1000),
      },
    });

    // 记录操作日志
    await this.addLog(id, {
      admin_name: "admin",
      log_info: "售后完成",
      refund_money: 0,
      refund_type: 0,
      refund_desc: "",
    });

    return !!result;
  }

  async addLog(
    aftersalesId: number,
    payload: {
      admin_name: string;
      log_info: string;
      refund_money?: number;
      refund_type?: number;
      refund_desc?: string;
      user_name?: string;
      return_pic?: string;
    },
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.prisma.aftersales_log.create({
      data: {
        aftersale_id: aftersalesId,
        admin_name: payload.admin_name ?? "admin",
        log_info: payload.log_info ?? "",
        refund_money: (payload.refund_money ?? 0) as any,
        refund_type: payload.refund_type ?? 0,
        refund_desc: payload.refund_desc ?? "",
        user_name: payload.user_name ?? "",
        return_pic: payload.return_pic ?? null,
        add_time: now,
      },
    });
  }

  private getAftersalesTypeName(type: number): string {
    return AFTERSALES_TYPE_NAME[type] || "未知类型";
  }

  private getStatusName(status: number): string {
    return STATUS_NAME[status] || "未知状态";
  }
}
