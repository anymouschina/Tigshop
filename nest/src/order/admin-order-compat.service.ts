// @ts-nocheck
import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
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
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    await this.prisma.order_log.create({
      data: {
        order_id: orderId,
        order_sn: order.order_sn,
        admin_id: 0,
        user_id: order.user_id,
        description: content || "",
        log_time: Math.floor(Date.now() / 1000),
        shop_id: order.shop_id,
      },
    });
    return true;
  }

  async saveExportItem(adminId: number, exportItems: string[]) {
    // 存储到 admin_user.order_export
    if (!adminId) return true;
    const payload = JSON.stringify(exportItems || []);
    await this.prisma.admin_user.update({
      where: { admin_id: adminId },
      data: { order_export: payload },
    }).catch(() => undefined);
    this.logger.log(`saveExportItem admin=${adminId} items=${payload}`);
    return true;
  }

  // ---------- 导出：字段清单/读取偏好/生成 CSV ----------
  getExportFieldDict() {
    // key -> { name: 列名, col?: 直接从 order 表取的列名, render?: 自定义渲染 }
    const dict: Record<string, { name: string; col?: string }> = {
      orderSn: { name: "订单编号", col: "order_sn" },
      addTime: { name: "下单时间", col: "add_time" },
      orderStatus: { name: "订单状态", col: "order_status" },
      payStatus: { name: "支付状态", col: "pay_status" },
      shippingStatus: { name: "发货状态", col: "shipping_status" },
      consignee: { name: "收货人", col: "consignee" },
      mobile: { name: "手机号", col: "mobile" },
      address: { name: "收货地址" },
      logisticsName: { name: "物流公司", col: "logistics_name" },
      trackingNo: { name: "物流单号", col: "tracking_no" },
      itemsCount: { name: "商品数量" },
      productNames: { name: "商品明细" },
      totalAmount: { name: "订单金额", col: "total_amount" },
      shippingFee: { name: "运费", col: "shipping_fee" },
      paidAmount: { name: "已支付", col: "paid_amount" },
      unpaidAmount: { name: "未支付", col: "unpaid_amount" },
      buyerNote: { name: "买家留言", col: "buyer_note" },
      adminNote: { name: "商家备注", col: "admin_note" },
    };
    return dict;
  }

  getDefaultExportFields(): string[] {
    return [
      "orderSn",
      "addTime",
      "consignee",
      "mobile",
      "address",
      "itemsCount",
      "totalAmount",
      "shippingFee",
      "paidAmount",
      "unpaidAmount",
      "payStatus",
      "shippingStatus",
      "logisticsName",
      "trackingNo",
      "buyerNote",
      "adminNote",
    ];
  }

  async getExportItemList() {
    const dict = this.getExportFieldDict();
    // 返回 [{ key, name }]
    return Object.entries(dict).map(([key, meta]) => ({ key, name: meta.name }));
  }

  async getExportItemInfo(adminId: number) {
    if (!adminId) return this.getDefaultExportFields();
    const row = await this.prisma.admin_user.findUnique({ where: { admin_id: adminId }, select: { order_export: true } });
    if (!row?.order_export) return this.getDefaultExportFields();
    try {
      const arr = JSON.parse(row.order_export || "[]");
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {}
    return this.getDefaultExportFields();
  }

  private parseIdsParam(raw: any): number[] {
    let ids: number[] = [];
    const pushId = (v: any) => {
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) ids.push(n);
    };
    if (Array.isArray(raw)) raw.forEach(pushId);
    else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed: any = JSON.parse(trimmed);
          if (Array.isArray(parsed)) parsed.forEach(pushId);
          else if (parsed && Array.isArray(parsed.ids)) parsed.ids.forEach(pushId);
        } catch {
          trimmed.split(",").forEach(pushId);
        }
      } else {
        trimmed.split(",").forEach(pushId);
      }
    } else if (typeof raw === "number") pushId(raw);
    ids = Array.from(new Set(ids));
    return ids;
  }

  private buildOrderWhereFromQuery(query: any) {
    const keyword = query.keyword?.trim();
    const orderStatus = query.orderStatus ?? query.order_status;
    const payStatus = query.payStatus ?? query.pay_status;
    const shippingStatus = query.shippingStatus ?? query.shipping_status;
    const startTime = query.startTime ?? query.start_time;
    const endTime = query.endTime ?? query.end_time;
    const ids = this.parseIdsParam(query.ids ?? query.rangeIds ?? query.orderIds);
    const where: any = { is_del: 0 };
    if (ids.length) where.order_id = { in: ids };
    if (keyword) {
      where.OR = [
        { order_sn: { contains: keyword } },
        { mobile: { contains: keyword } },
        { consignee: { contains: keyword } },
      ];
    }
    if (orderStatus !== undefined && orderStatus !== "") where.order_status = Number(orderStatus);
    if (payStatus !== undefined && payStatus !== "") where.pay_status = Number(payStatus);
    if (shippingStatus !== undefined && shippingStatus !== "") where.shipping_status = Number(shippingStatus);
    if (startTime || endTime) {
      const from = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : undefined;
      const to = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : undefined;
      where.add_time = { ...(from !== undefined && { gte: from }), ...(to !== undefined && { lte: to }) };
    }
    return where;
  }

  private tsToStr(ts?: number) {
    if (!ts) return "";
    try {
      const d = new Date((Number(ts) || 0) * 1000);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch { return ""; }
  }

  private normalizeAddress(order: any) {
    const names = order.region_names || "";
    const addr = order.address || "";
    return names ? `${names} ${addr}`.trim() : addr;
  }

  private num(val: any) {
    if (val == null) return "0";
    const n = Number(val);
    return Number.isFinite(n) ? String(n) : String(val);
  }

  async buildOrderExportRows(query: any, fields: string[]) {
    const dict = this.getExportFieldDict();
    const where = this.buildOrderWhereFromQuery(query);
    // 拉取订单
    const orders = await this.prisma.order.findMany({ where, orderBy: { add_time: "desc" } });
    if (!orders.length) return { headers: fields.map((k) => dict[k]?.name || k), rows: [] as string[][] };
    // 拉取订单项以便汇总
    const ids = orders.map((o: any) => o.order_id);
    const items = await this.prisma.order_item.findMany({ where: { order_id: { in: ids } } });
    const itemMap = new Map<number, any[]>();
    for (const it of items) {
      const arr = itemMap.get(it.order_id) || [];
      arr.push(it);
      itemMap.set(it.order_id, arr);
    }
    const headers = fields.map((k) => dict[k]?.name || k);
    const rows: string[][] = [];
    for (const o of orders) {
      const its = itemMap.get(o.order_id) || [];
      const productNames = its.map((it: any) => `${it.product_name}x${it.product_nums}`).join(" | ");
      const itemsCount = its.reduce((sum, it: any) => sum + Number(it.product_nums || 0), 0);
      const address = this.normalizeAddress(o);
      const line: string[] = [];
      for (const key of fields) {
        switch (key) {
          case "orderSn": line.push(o.order_sn || ""); break;
          case "addTime": line.push(this.tsToStr(o.add_time)); break;
          case "orderStatus": line.push(this.num(o.order_status)); break;
          case "payStatus": line.push(this.num(o.pay_status)); break;
          case "shippingStatus": line.push(this.num(o.shipping_status)); break;
          case "consignee": line.push(o.consignee || ""); break;
          case "mobile": line.push(o.mobile || ""); break;
          case "address": line.push(address); break;
          case "logisticsName": line.push(o.logistics_name || ""); break;
          case "trackingNo": line.push(o.tracking_no || ""); break;
          case "itemsCount": line.push(String(itemsCount)); break;
          case "productNames": line.push(productNames); break;
          case "totalAmount": line.push(this.num(o.total_amount)); break;
          case "shippingFee": line.push(this.num(o.shipping_fee)); break;
          case "paidAmount": line.push(this.num(o.paid_amount)); break;
          case "unpaidAmount": line.push(this.num(o.unpaid_amount)); break;
          case "buyerNote": line.push(o.buyer_note || ""); break;
          case "adminNote": line.push(o.admin_note || ""); break;
          default: {
            const meta = dict[key];
            if (meta?.col && Object.prototype.hasOwnProperty.call(o, meta.col)) line.push(String((o as any)[meta.col] ?? ""));
            else line.push("");
          }
        }
      }
      rows.push(line);
    }
    return { headers, rows };
  }

  // ---------- 订单操作实现（基础版本，支持传入目标状态，默认常用值） ----------
  async deliver(orderId: number, data: { trackingNo?: string; logisticsId?: any; logisticsName?: string; shippingStatus?: any }, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const now = Math.floor(Date.now() / 1000);
    const shipping_status = data?.shippingStatus != null ? Number(data.shippingStatus) : 1; // 默认 1=已发货
    await this.prisma.order.update({
      where: { order_id: orderId },
      data: {
        tracking_no: data?.trackingNo ?? order.tracking_no,
        logistics_id: data?.logisticsId != null ? Number(data.logisticsId) : order.logistics_id,
        logistics_name: data?.logisticsName ?? order.logistics_name,
        shipping_time: now,
        shipping_status,
      },
    });
    await this.addLog(orderId, `发货：物流=${data?.logisticsName ?? order.logistics_name} 单号=${data?.trackingNo ?? order.tracking_no}`, adminName);
    return true;
  }

  async confirmReceipt(orderId: number, shippingStatus?: any, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const now = Math.floor(Date.now() / 1000);
    const status = shippingStatus != null ? Number(shippingStatus) : 2; // 默认 2=已收货
    await this.prisma.order.update({ where: { order_id: orderId }, data: { shipping_status: status, received_time: now } });
    await this.addLog(orderId, "确认收货", adminName);
    return true;
  }

  async setPaid(orderId: number, payStatus?: any, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const now = Math.floor(Date.now() / 1000);
    const status = payStatus != null ? Number(payStatus) : 1; // 默认 1=已支付
    await this.prisma.order.update({ where: { order_id: orderId }, data: { pay_status: status, pay_time: now } });
    await this.addLog(orderId, "设置已支付", adminName);
    return true;
  }

  async cancelOrder(orderId: number, reason?: string, orderStatus?: any, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const status = orderStatus != null ? Number(orderStatus) : 2; // 默认 2=已取消（占位值）
    await this.prisma.order.update({ where: { order_id: orderId }, data: { order_status: status } });
    await this.addLog(orderId, `取消订单${reason ? `：${reason}` : ""}`, adminName);
    return true;
  }

  async setConfirm(orderId: number, orderStatus?: any, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const status = orderStatus != null ? Number(orderStatus) : 1; // 默认 1=已确认
    await this.prisma.order.update({ where: { order_id: orderId }, data: { order_status: status } });
    await this.addLog(orderId, "设置已确认", adminName);
    return true;
  }

  async delOrder(orderId: number, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    await this.prisma.order.update({ where: { order_id: orderId }, data: { is_del: 1 } });
    await this.addLog(orderId, "删除订单（软删）", adminName);
    return true;
  }

  async modifyMoney(orderId: number, patch: Record<string, any>, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const numericKeys = [
      "total_amount","shipping_fee","discount_amount","coupon_amount","invoice_fee","service_fee","product_amount"
    ];
    const data: any = {};
    for (const k of numericKeys) {
      const val = patch[k] ?? patch[this.camelToSnake(k)];
      if (val != null && val !== "") data[k] = Number(val);
    }
    if (Object.keys(data).length === 0) throw new BadRequestException("未提供可变更金额字段");
    await this.prisma.order.update({ where: { order_id: orderId }, data });
    await this.addLog(orderId, `修改金额：${JSON.stringify(data)}`, adminName);
    return true;
  }

  async modifyConsignee(orderId: number, patch: Record<string, any>, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const data: any = {};
    const map = {
      consignee: "consignee",
      mobile: "mobile",
      regionIds: "region_ids",
      regionNames: "region_names",
      address: "address",
      addressData: "address_data",
    } as const;
    for (const [inKey, col] of Object.entries(map)) {
      const v = patch[inKey] ?? patch[this.snakeToCamel(col)];
      if (v != null) data[col] = typeof v === "object" ? JSON.stringify(v) : v;
    }
    if (Object.keys(data).length === 0) throw new BadRequestException("未提供修改项");
    await this.prisma.order.update({ where: { order_id: orderId }, data });
    await this.addLog(orderId, `修改收货信息`, adminName);
    return true;
  }

  async modifyShipping(orderId: number, patch: Record<string, any>, adminName?: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const data: any = {};
    const map = {
      logisticsId: "logistics_id",
      logisticsName: "logistics_name",
      shippingTypeId: "shipping_type_id",
      shippingTypeName: "shipping_type_name",
      shippingMethod: "shipping_method",
      trackingNo: "tracking_no",
    } as const;
    for (const [inKey, col] of Object.entries(map)) {
      const v = patch[inKey] ?? patch[this.snakeToCamel(col)];
      if (v != null) data[col] = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v;
    }
    if (patch.shippingStatus != null) data.shipping_status = Number(patch.shippingStatus);
    if (Object.keys(data).length === 0) throw new BadRequestException("未提供修改项");
    await this.prisma.order.update({ where: { order_id: orderId }, data });
    await this.addLog(orderId, `修改配送信息`, adminName);
    return true;
  }

  async setAdminNote(orderId: number, note: string, adminName?: string) {
    await this.prisma.order.update({ where: { order_id: orderId }, data: { admin_note: note ?? "" } });
    await this.addLog(orderId, `设置商家备注`, adminName);
    return true;
  }

  async shippingInfo(orderId: number) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const { logistics_id, logistics_name, tracking_no, shipping_status, shipping_time, received_time } = order as any;
    return { logistics_id, logistics_name, tracking_no, shipping_status, shipping_time, received_time };
  }

  // ---------- 扩展：打印/面单/父订单/批量/页面配置 ----------
  async getParentDetail(orderId: number) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const parentId = order.parent_order_id && order.parent_order_id > 0 ? order.parent_order_id : order.order_id;
    const parent = await this.prisma.order.findUnique({ where: { order_id: parentId } });
    const children = await this.prisma.order.findMany({ where: { parent_order_id: parentId }, orderBy: { order_id: "asc" } });
    return { parent, children };
  }

  async getOrderPrintData(orderId: number) {
    const base = await this.detail(orderId);
    if (!base) throw new NotFoundException("订单不存在");
    // 简化：返回打印所需关键信息
    const address = this.normalizeAddress(base);
    const summary = {
      totalQuantity: (base.items || []).reduce((s: number, it: any) => s + Number(it.product_nums || 0), 0),
      totalAmount: base.total_amount,
      paidAmount: base.paid_amount,
      unpaidAmount: base.unpaid_amount,
    };
    return {
      orderSn: base.order_sn,
      addTime: base.add_time,
      consignee: base.consignee,
      mobile: base.mobile,
      address,
      buyerNote: base.buyer_note,
      adminNote: base.admin_note,
      logisticsName: base.logistics_name,
      trackingNo: base.tracking_no,
      items: (base.items || []).map((it: any) => ({
        productName: it.product_name,
        skuSn: it.sku_sn,
        skuData: it.sku_data,
        price: it.product_price,
        quantity: it.product_nums,
        amount: Number(it.product_price || 0) * Number(it.product_nums || 0),
      })),
      summary,
    };
  }

  async getOrderWayBill(orderId: number) {
    // 电子面单数据（仅组装数据，未对接第三方）
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    const address = this.normalizeAddress(order);
    return {
      orderSn: order.order_sn,
      consignee: order.consignee,
      mobile: order.mobile,
      address,
      logisticsId: order.logistics_id,
      logisticsName: order.logistics_name,
      trackingNo: order.tracking_no,
      remark: order.buyer_note || order.admin_note || "",
    };
  }

  async getOrderPrintBill(orderId: number) {
    // 打印电子面单所需字段（同 getOrderWayBill，但可扩展模板字段）
    const bill = await this.getOrderWayBill(orderId);
    return { ...bill, template: "default" };
  }

  async batchOperation(type: string, ids: number[], data: any, adminName?: string) {
    if (!Array.isArray(ids) || !ids.length) throw new BadRequestException("ids 不能为空");
    const results: Record<number, boolean> = {};
    for (const id of ids) {
      try {
        switch (type) {
          case "del":
          case "delete":
            await this.delOrder(id, adminName); break;
          case "confirm":
          case "setConfirm":
            await this.setConfirm(id, data?.orderStatus ?? data?.order_status, adminName); break;
          case "paid":
          case "setPaid":
            await this.setPaid(id, data?.payStatus ?? data?.pay_status, adminName); break;
          case "deliver":
            await this.deliver(id, {
              trackingNo: data?.trackingNo ?? data?.tracking_no,
              logisticsId: data?.logisticsId ?? data?.logistics_id,
              logisticsName: data?.logisticsName ?? data?.logistics_name,
              shippingStatus: data?.shippingStatus ?? data?.shipping_status,
            }, adminName); break;
          case "cancel":
          case "cancelOrder":
            await this.cancelOrder(id, data?.reason ?? data?.remark, data?.orderStatus ?? data?.order_status, adminName); break;
          default:
            // 未知操作：记录日志但不中断
            await this.addLog(id, `批量操作(${type}) 未实现，忽略`, adminName);
        }
        results[id] = true;
      } catch (e) {
        this.logger.error(`batchOperation id=${id} type=${type} err=${(e as Error).message}`);
        results[id] = false;
      }
    }
    return { ok: true, results };
  }

  async getSeveralDetail(ids: number[]) {
    if (!ids?.length) return [] as any[];
    const orders = await this.prisma.order.findMany({ where: { order_id: { in: ids } } });
    // 附带各自的订单项数量与金额
    const items = await this.prisma.order_item.findMany({ where: { order_id: { in: ids } } });
    const grouped = new Map<number, any[]>();
    for (const it of items) {
      const arr = grouped.get(it.order_id) || [];
      arr.push(it);
      grouped.set(it.order_id, arr);
    }
    return orders.map((o: any) => {
      const its = grouped.get(o.order_id) || [];
      const itemsCount = its.reduce((s, it: any) => s + Number(it.product_nums || 0), 0);
      const productNames = its.map((it: any) => `${it.product_name}x${it.product_nums}`).join(" | ");
      return {
        order_id: o.order_id,
        order_sn: o.order_sn,
        add_time: o.add_time,
        consignee: o.consignee,
        mobile: o.mobile,
        address: this.normalizeAddress(o),
        items_count: itemsCount,
        product_names: productNames,
        total_amount: o.total_amount,
        pay_status: o.pay_status,
        shipping_status: o.shipping_status,
      };
    });
  }

  async getOrderPageConfig() {
    // 简化：返回筛选项与默认列配置
    return {
      filters: {
        orderStatus: [0, 1, 2, 3, 4, 5, 6],
        payStatus: [0, 1, 2, 3],
        shippingStatus: [0, 1, 2],
      },
      defaultColumns: this.getDefaultExportFields(),
      pageSizeOptions: [10, 15, 20, 50, 100],
    };
  }

  async modifyProduct(orderId: number, payload: any, adminName?: string) {
    // 复杂度较高，当前仅记录日志，提示前端未真正变更
    await this.addLog(orderId, `修改商品（占位）：${JSON.stringify(payload).slice(0, 500)}`, adminName);
    return true;
  }

  async getAddProductInfo(orderId: number) {
    // 返回最小必要信息，允许前端展示可添加提示
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    return { allowAdd: true, orderSn: order.order_sn };
  }

  // ---------- 工具 ----------
  private snakeToCamel(s: string) { return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private camelToSnake(s: string) { return s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase()); }
}
