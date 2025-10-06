// @ts-nocheck
import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminOrderCompatService {
  private readonly logger = new Logger(AdminOrderCompatService.name);
  constructor(private readonly prisma: PrismaService) {}

  async list(query: any) {
    // 分页
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const skip = (page - 1) * size;

    // where 构建（沿用与 PHP 对齐的参数名）
    const where = this.buildOrderWhereFromQuery(query);
    // 追加 mark 过滤：-1 表示不过滤
    const markRaw = query.mark ?? query.orderMark;
    if (markRaw !== undefined && markRaw !== "" && String(markRaw) !== "-1") {
      (where as any).mark = Number(markRaw);
    }
    // 补充 shopId / vendorId / userId 精确过滤（管理端常见）
    const shopId = query.shopId ?? query.shop_id;
    if (shopId !== undefined && shopId !== "") (where as any).shop_id = Number(shopId);
    const vendorId = query.vendorId ?? query.vendor_id;
    if (vendorId !== undefined && vendorId !== "") (where as any).vendor_id = Number(vendorId);
    const userId = query.userId ?? query.user_id;
    if (userId !== undefined && userId !== "") (where as any).user_id = Number(userId);

    // 排序：支持 sortField/sortOrder，字段名按 PHP 约定映射
    const sortField = String(query.sortField || query.sort_field || "addTime");
    const sortOrder = String(query.sortOrder || query.sort_order || "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const sortMap: Record<string, string> = {
      orderId: "order_id",
      orderSn: "order_sn",
      addTime: "add_time",
      totalAmount: "total_amount",
      paidAmount: "paid_amount",
      unpaidAmount: "unpaid_amount",
      shippingFee: "shipping_fee",
      payStatus: "pay_status",
      orderStatus: "order_status",
      shippingStatus: "shipping_status",
    };
    const sortCol = sortMap[sortField] || "add_time";

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({ where, orderBy: { [sortCol]: sortOrder as any }, skip, take: size }),
      this.prisma.order.count({ where }),
    ]);

    if (!orders.length) {
      return { records: [], total, size, current: page, pages: Math.max(1, Math.ceil((total || 0) / size)) };
    }

    // 关联查询：订单项、用户、店铺、商品与 SKU 库存
    const orderIds = orders.map((o) => o.order_id);
  const userIds = Array.from(new Set(orders.map((o) => o.user_id).filter((x) => x > 0)));
  const shopIds = Array.from(new Set(orders.map((o) => o.shop_id).filter((x) => x > 0)));

    const items = await this.prisma.order_item.findMany({ where: { order_id: { in: orderIds } } });
  const skuIds = Array.from(new Set(items.map((it) => it.sku_id).filter((x) => x > 0)));
  const productIds = Array.from(new Set(items.map((it) => it.product_id).filter((x) => x > 0)));

    const [users, shops, skus, products] = await Promise.all([
      userIds.length ? this.prisma.user.findMany({ where: { user_id: { in: userIds } } }) : Promise.resolve([]),
      shopIds.length ? this.prisma.shop.findMany({ where: { shop_id: { in: shopIds } } }) : Promise.resolve([]),
      skuIds.length ? this.prisma.product_sku.findMany({ where: { sku_id: { in: skuIds } } }) : Promise.resolve([]),
      productIds.length ? this.prisma.product.findMany({ where: { product_id: { in: productIds } } }) : Promise.resolve([]),
    ]);

    const userMap = new Map(users.map((u: any) => [u.user_id, u]));
    const shopMap = new Map(shops.map((s: any) => [s.shop_id, s]));
    const skuMap = new Map(skus.map((s: any) => [s.sku_id, s]));
    const productMap = new Map(products.map((p: any) => [p.product_id, p]));

    // 将订单项按订单分组，并补充库存字段
    const itemMap = new Map<number, any[]>();
    for (const it of items) {
      const arr = itemMap.get(it.order_id) || [];
      const s = skuMap.get(it.sku_id);
      const p = productMap.get(it.product_id);
      (it as any).sku_stock = s ? Number(s.sku_stock || 0) : null;
      (it as any).product_stock = p ? Number(p.product_stock || 0) : null;
      (it as any).sku_value_str = s ? (s.sku_value || null) : null;
      arr.push(it);
      itemMap.set(it.order_id, arr);
    }

  const records = orders.map((o) => this.mapOrderRowToRecord(o, itemMap.get(o.order_id) || [], userMap, shopMap));

    return { records, total, size, current: page, pages: Math.max(1, Math.ceil((total || 0) / size)) };
  }

  async detail(id: number) {
    const o = await this.prisma.order.findUnique({ where: { order_id: id } });
    if (!o) throw new NotFoundException("订单不存在");

    const [items, logs] = await Promise.all([
      this.prisma.order_item.findMany({ where: { order_id: id } }),
      this.prisma.order_log.findMany({ where: { order_id: id }, orderBy: { log_id: "desc" } }),
    ]);

    // 关联数据：用户、店铺、商品、SKU
    const [user, shop] = await Promise.all([
      o.user_id ? this.prisma.user.findUnique({ where: { user_id: o.user_id } }).catch(() => null) : Promise.resolve(null),
      o.shop_id ? this.prisma.shop.findUnique({ where: { shop_id: o.shop_id } }).catch(() => null) : Promise.resolve(null),
    ]);
    const productIds = Array.from(new Set(items.map((it) => it.product_id).filter((x) => x > 0)));
    const skuIds = Array.from(new Set(items.map((it) => it.sku_id).filter((x) => x > 0)));
    const [products, skus] = await Promise.all([
      productIds.length ? this.prisma.product.findMany({ where: { product_id: { in: productIds } } }) : Promise.resolve([]),
      skuIds.length ? this.prisma.product_sku.findMany({ where: { sku_id: { in: skuIds } } }) : Promise.resolve([]),
    ]);
    const userMap = new Map(user ? [[user.user_id, user]] : []);
    const shopMap = new Map(shop ? [[shop.shop_id, shop]] : []);
    const productMap = new Map(products.map((p: any) => [p.product_id, p]));
    const skuMap = new Map(skus.map((s: any) => [s.sku_id, s]));

    // 补充库存字段
    const itemsWithStock = items.map((it) => {
      const s = skuMap.get(it.sku_id);
      const p = productMap.get(it.product_id);
      (it as any).sku_stock = s ? Number(s.sku_stock || 0) : null;
      (it as any).product_stock = p ? Number(p.product_stock || 0) : null;
      (it as any).sku_value_str = s ? (s.sku_value || null) : null;
      return it;
    });

    const record = this.mapOrderRowToRecord(o, itemsWithStock, userMap, shopMap);
    // 追加 admin 详情期望字段
    const stepStatus = this.buildStepStatus(o);
    const totalProductWeight = itemsWithStock.reduce((sum, it) => {
      const p = productMap.get(it.product_id);
      const w = p ? Number(p.product_weight || 0) : 0;
      return sum + w * Number(it.quantity || 0);
    }, 0);
  // 面单能力：先返回 true 标识可用（后续接 SDK 时可联调）
  const wayBill = true;
  // 预售/预订单状态：按示例/PHP 语义，pay_status=2 时视作预单已取消
  let preOrderStatus: number | null = null;
  let preOrderStatusDesc: string | null = null;
  if (Number(o.pay_status) === 2) { preOrderStatus = 3; preOrderStatusDesc = "已取消"; }
  else if (Number(o.order_status) === 2) { preOrderStatus = 3; preOrderStatusDesc = "已取消"; }
  const isChangeOrderStatus = (Number(o.pay_status) >= 1 || Number(o.order_status) === 2 || Number(o.order_status) === 3) ? 1 : 0;
    const mappedLogs = logs.map((lg) => ({
      logId: lg.log_id,
      orderId: lg.order_id,
      orderSn: lg.order_sn,
      adminId: lg.admin_id,
      userId: lg.user_id,
      description: lg.description,
      logTime: this.formatUnixToTime(lg.log_time),
      shopId: lg.shop_id,
    }));

    return { ...record, logs: mappedLogs, stepStatus, totalProductWeight, wayBill, preOrderStatus, preOrderStatusDesc, isChangeOrderStatus };
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

  /**
   * 订单按店铺/供应商拆分：
   * - 若 order_item.vendor_id 存在且分组数>1，按 vendor_id 拆分；否则按 item.shop_id 拆分
   * - 为每个分组创建子订单（parent_order_id/parent_order_sn 指向原订单），并迁移对应的 order_item 到新订单
   * - 金额按各分组商品小计占比对原订单金额进行比例分摊（保留两位小数，最后一个分组吃掉尾差）
   * - 将原订单标记 is_store_splited=1
   */
  async splitStoreOrder(orderId: number): Promise<boolean> {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException("订单不存在");
    if (order.is_store_splited) return true;

    const items = await this.prisma.order_item.findMany({ where: { order_id: orderId } });
    if (!items.length) return true;

    // 选择分组键：优先 vendor_id，其次 shop_id
    const hasVendorSplit = items.some((it) => (it.vendor_id ?? 0) > 0);
    const key: "vendor_id" | "shop_id" = hasVendorSplit ? "vendor_id" : "shop_id";
    const groups = new Map<number, typeof items>();
    for (const it of items) {
      const k = Number((it as any)[key] || 0);
      const arr = groups.get(k) || [];
      arr.push(it);
      groups.set(k, arr);
    }
    // 只有分组数大于1才需要拆单，否则不标记 is_store_splited
    if (groups.size <= 1) {
      // 单店铺/供应商订单，不需要拆单，不标记 is_store_splited
      if (order.is_store_splited !== 0) {
        await this.prisma.order.update({ where: { order_id: orderId }, data: { is_store_splited: 0 } });
      }
      return true;
    }

    // 计算各分组小计
    const sum2 = (n: any) => Number(n ?? 0);
    const itemSubtotal = (it: any) => sum2(it.price) * sum2(it.quantity);
    const groupList = Array.from(groups.entries()).map(([k, arr]) => {
      const subtotal = arr.reduce((acc, it) => acc + itemSubtotal(it), 0);
      return { key: k, items: arr, subtotal };
    });
    const totalSubtotal = groupList.reduce((acc, g) => acc + g.subtotal, 0) || 1;

    // 原金额
    const oShipping = Number(order.shipping_fee || 0);
    const oProduct = Number(order.product_amount || 0);
    const oTotal = Number(order.total_amount || 0);
    const oPaid = Number(order.paid_amount || 0);
    const oUnpaid = Number(order.unpaid_amount || 0);

    // 生成子单并迁移明细
    const now = Math.floor(Date.now() / 1000);
    const children: number[] = [];

    // 辅助：生成唯一订单号（20位内）
    const genSn = async (): Promise<string> => {
      for (let i = 0; i < 5; i++) {
        const base = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
        const sn = base.slice(-20);
        const exists = await this.prisma.order.findUnique({ where: { order_sn: sn } }).catch(() => null);
        if (!exists) return sn;
      }
      // 兜底：原单号+时间尾巴裁剪
      const fallback = `${order.order_sn}${Date.now()}`.slice(-20);
      return fallback;
    };

    let shipAssigned = 0, paidAssigned = 0, unpaidAssigned = 0, totalAssigned = 0, productAssigned = 0;
    await this.prisma.$transaction(async (tx) => {
      for (let idx = 0; idx < groupList.length; idx++) {
        const g = groupList[idx];
        const isLast = idx === groupList.length - 1;
        const ratio = g.subtotal / totalSubtotal;

        // 分摊金额，最后一个吃尾差
        const product_amount = isLast ? (oProduct - productAssigned) : Number((oProduct * ratio).toFixed(2));
        const shipping_fee = isLast ? (oShipping - shipAssigned) : Number((oShipping * ratio).toFixed(2));
        const total_amount = isLast ? (oTotal - totalAssigned) : Number((oTotal * ratio).toFixed(2));
        const paid_amount = isLast ? (oPaid - paidAssigned) : Number((oPaid * ratio).toFixed(2));
        const unpaid_amount = isLast ? (oUnpaid - unpaidAssigned) : Number((oUnpaid * ratio).toFixed(2));

        shipAssigned += shipping_fee; paidAssigned += paid_amount; unpaidAssigned += unpaid_amount; totalAssigned += total_amount; productAssigned += product_amount;

        const childSn = await genSn();
        const child = await tx.order.create({
          data: {
            // 父子关联与标识
            parent_order_id: order.order_id,
            parent_order_sn: order.order_sn,
            order_sn: childSn,
            add_time: now,
            // 继承关键状态/收货信息
            user_id: order.user_id,
            order_status: order.order_status,
            shipping_status: order.shipping_status,
            pay_status: order.pay_status,
            consignee: order.consignee,
            address: order.address,
            region_ids: order.region_ids,
            region_names: order.region_names,
            address_data: order.address_data,
            mobile: order.mobile,
            email: order.email,
            buyer_note: order.buyer_note,
            admin_note: order.admin_note,
            shipping_method: order.shipping_method,
            logistics_id: order.logistics_id,
            logistics_name: order.logistics_name,
            shipping_type_id: order.shipping_type_id,
            shipping_type_name: order.shipping_type_name,
            tracking_no: "",
            shipping_time: 0,
            received_time: 0,
            pay_type_id: order.pay_type_id,
            pay_time: 0,
            use_points: order.use_points,
            is_need_commisson: order.is_need_commisson,
            distribution_status: order.distribution_status,
            referrer_user_id: order.referrer_user_id,
            is_del: 0,
            shop_id: key === "shop_id" ? g.key : order.shop_id,
            is_store_splited: 0,
            comment_status: order.comment_status,
            // 金额分摊
            product_amount,
            shipping_fee,
            total_amount,
            paid_amount,
            unpaid_amount,
            coupon_amount: order.coupon_amount,
            points_amount: order.points_amount,
            discount_amount: order.discount_amount,
            balance: order.balance,
            online_paid_amount: order.online_paid_amount,
            offline_paid_amount: order.offline_paid_amount,
            service_fee: order.service_fee,
            invoice_fee: order.invoice_fee,
            order_extension: order.order_extension,
            order_source: order.order_source,
            invoice_data: order.invoice_data,
            out_trade_no: "",
            is_settlement: order.is_settlement ?? 0,
            is_exchange_order: order.is_exchange_order ?? false,
            order_type: order.order_type ?? 1,
            mark: order.mark ?? 0,
            vendor_id: key === "vendor_id" ? (g.key || null) : order.vendor_id,
          },
        });
        children.push(child.order_id);

        // 迁移明细
        await tx.order_item.updateMany({
          where: { order_id: order.order_id, item_id: { in: g.items.map((it) => it.item_id) } },
          data: { order_id: child.order_id, order_sn: child.order_sn, shop_id: child.shop_id, vendor_id: child.vendor_id ?? undefined },
        });
      }

      // 标记原单已拆分
      await tx.order.update({ where: { order_id: order.order_id }, data: { is_store_splited: 1 } });
    });
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
    if (orderStatus !== undefined && orderStatus !== "" && String(orderStatus) !== "-1") where.order_status = Number(orderStatus);
    if (payStatus !== undefined && payStatus !== "" && String(payStatus) !== "-1") where.pay_status = Number(payStatus);
    if (shippingStatus !== undefined && shippingStatus !== "" && String(shippingStatus) !== "-1") where.shipping_status = Number(shippingStatus);
    if (startTime || endTime) {
      const from = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : undefined;
      const to = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : undefined;
      where.add_time = { ...(from !== undefined && { gte: from }), ...(to !== undefined && { lte: to }) };
    }
    return where;
  }

  // ====== 列表项格式化（对齐 PHP 返回） ======
  private mapOrderRowToRecord(o: any, items: any[], userMap: Map<number, any>, shopMap: Map<number, any>) {
    const money = (v: any) => this.formatMoney(v);
    const addTimeText = this.formatUnixToTime(o.add_time);
    const regionIds = this.safeParseArray(o.region_ids);
    const regionNames = this.safeParseArray(o.region_names);
    const addressData = this.safeParseJson(o.address_data);
    const orderExtension = this.safeParseJson(o.order_extension);

    const user = userMap.get(o.user_id);
    const shop = o.shop_id > 0 ? shopMap.get(o.shop_id) : null;

    const userAddress = this.composeUserAddress(regionNames, o.address);
    const shippingTypeId = Number(o.shipping_type_id || 1);
    const shippingTypeName = o.shipping_type_name || "普通快递";

    return {
      orderStatusName: this.getOrderStatusName(o.order_status),
      userAddress,
      shippingStatusName: this.getShippingStatusName(o.shipping_status),
      payStatusName: this.getPayStatusName(o.pay_status),
      orderId: o.order_id,
      orderSn: o.order_sn,
      userId: o.user_id,
      parentOrderId: o.parent_order_id,
      parentOrderSn: o.parent_order_sn,
      orderStatus: o.order_status,
      shippingStatus: o.shipping_status,
      payStatus: o.pay_status,
      addTime: addTimeText,
      consignee: o.consignee,
      address: o.address,
      regionIds,
      regionNames,
      addressData: this.mapAddressData(addressData),
      mobile: o.mobile,
      email: o.email,
      buyerNote: o.buyer_note,
      adminNote: o.admin_note,
      shippingMethod: o.shipping_method,
      logisticsId: o.logistics_id,
      logisticsName: o.logistics_name,
      shippingTypeId,
      shippingTypeName,
      trackingNo: o.tracking_no,
      shippingTime: o.shipping_time ? this.formatUnixToTime(o.shipping_time) : "",
      receivedTime: o.received_time ? this.formatUnixToTime(o.received_time) : "",
      payTypeId: o.pay_type_id,
      payTime: o.pay_time ? this.formatUnixToTime(o.pay_time) : "",
      usePoints: o.use_points,
      isNeedCommisson: o.is_need_commisson ? 1 : 0,
      distributionStatus: o.distribution_status ? 1 : 0,
      referrerUserId: o.referrer_user_id,
      isDel: o.is_del,
      shopId: o.shop_id,
      isStoreSplited: o.is_store_splited,
      commentStatus: o.comment_status,
      totalAmount: money(o.total_amount),
      paidAmount: money(o.paid_amount),
      unpaidAmount: money(o.unpaid_amount),
      unrefundAmount: money(o.unrefund_amount),
      productAmount: money(o.product_amount),
      couponAmount: money(o.coupon_amount),
      pointsAmount: money(o.points_amount),
      discountAmount: money(o.discount_amount),
      balance: money(o.balance),
      onlinePaidAmount: money(o.online_paid_amount),
      offlinePaidAmount: money(o.offline_paid_amount),
      serviceFee: money(o.service_fee),
      shippingFee: money(o.shipping_fee),
      invoiceFee: money(o.invoice_fee),
      orderExtension: this.mapOrderExtension(orderExtension),
      orderSource: o.order_source || "",
      invoiceData: o.invoice_data || "",
      outTradeNo: o.out_trade_no || "",
      isSettlement: o.is_settlement ?? 0,
      isExchangeOrder: o.is_exchange_order ? 1 : 0,
      orderType: o.order_type ?? 1,
      mark: o.mark ?? 0,
      vendorId: o.vendor_id ?? 0,
  availableActions: this.getAvailableActions(o.order_status, o.pay_status, o.shipping_status, o.is_store_splited),
      autoDeliveryDays: null,
      preOrderStatus: null,
      preOrderStatusDesc: null,
      isChangeOrderStatus: 0,
      vendorName: "",
      items: items.map((it) => this.mapOrderItem(it)),
      user: user
        ? { username: user.username, nickname: user.nickname || "", userId: user.user_id, mobile: user.mobile || "" }
        : null,
      shop: shop
        ? {
            statusText: "",
            shopId: shop.shop_id,
            shopTitle: shop.shop_title || "",
            kefuInlet: this.safeParseArray(shop.kefu_inlet),
            kefuLink: shop.kefu_link || "",
            kefuPhone: shop.kefu_phone || "",
            description: shop.description || "",
          }
        : null,
      payLog: null,
    };
  }

  private mapOrderItem(it: any) {
    this.logger.debug(`mapOrderItem item=${JSON.stringify(it)}`);
    const money = (v: any) => this.formatMoney(v);
    const skuData = this.safeParseArray(it.sku_data);
  let skuValue = this.buildSkuValue(skuData, this.safeParseArray(it.extra_sku_data), (it as any).sku_value_str);
    return {
      itemId: it.item_id,
      orderId: it.order_id,
      orderSn: it.order_sn,
      userId: it.user_id,
      price: money(it.price),
      quantity: it.quantity,
      productId: it.product_id,
      productName: it.product_name,
      productSn: it.product_sn,
      picThumb: it.pic_thumb,
      skuId: it.sku_id,
      skuData: Array.isArray(skuData) ? skuData : [],
      deliveryQuantity: it.delivery_quantity,
      productType: it.product_type,
      isGift: it.is_gift,
      shopId: it.shop_id,
      isPin: it.is_pin,
      prepayPrice: money(it.prepay_price),
      commission: it.commission || "",
      originPrice: money(it.origin_price),
      isSeckill: it.is_seckill || 0,
      extraSkuData: this.safeParseArray(it.extra_sku_data) || [],
      suppliersId: it.suppliers_id || 0,
      cardGroupName: it.card_group_name || "",
      vendorProductId: it.vendor_product_id || 0,
      vendorProductSkuId: it.vendor_product_sku_id || 0,
      vendorId: it.vendor_id || 0,
      vendorProductSupplyPrice: null,
      productPicThumb: it.pic_thumb,
      productStock: (it as any).product_stock ?? null,
      productWeight: "0.000",
      virtualSample: "",
      paidContent: "",
      cardGroupId: 0,
      skuStock: (it as any).sku_stock ?? null,
      skuSn: null,
      skuValue,
      // 额外对齐
      stock: (it as any).product_stock ?? null,
      subtotal: money((Number(it.price || 0) || 0) * (Number(it.quantity || 0) || 0)),
      allowDeliverNum: Math.max(0, Number(it.quantity || 0) - Number(it.delivery_quantity || 0)),
      aftersalesItem: null,
      eCard: [],
    };
  }

  private buildSkuValue(skuData: any[], extra: any[], skuValueStr?: string) {
    const pairs: string[] = [];
    const tryPush = (e: any) => {
      if (!e || typeof e !== "object") return;
      let name = e.name ?? e.attrName ?? e.k ?? e.key ?? e.label ?? "";
      let value = e.value ?? e.attrValue ?? e.v ?? e.val ?? e.valueId ?? e.id ?? "";
      name = name == null ? "" : String(name).trim();
      value = value == null ? "" : String(value).trim();
      if (name && value) pairs.push(`${name}:${value}`);
    };
    this.logger.debug(`buildSkuValue skuData=${JSON.stringify(skuData)} extra=${JSON.stringify(extra)} skuValueStr=${skuValueStr}`);
    if (Array.isArray(skuData)) skuData.forEach(tryPush);
    if (!pairs.length && Array.isArray(extra)) extra.forEach(tryPush);
    if (pairs.length) return pairs.join("|");
    if (skuValueStr) {
      // 兜底：使用 product_sku.sku_value，规范分隔符
      const normalized = String(skuValueStr)
        .replace(/，/g, ",")
        .replace(/：/g, ":")
        .replace(/\s*[-~]\s*/g, ":");
      return normalized || null;
    }
    return null;
  }

  private buildStepStatus(order: any) {
    const addDesc = this.formatUnixToTime(order.add_time);
    const paid = Number(order.pay_status) > 0;
    const shipped = Number(order.shipping_status) > 0;
    const steps = [
      { title: "提交订单", description: addDesc },
      { title: paid ? "已支付" : "待支付", description: paid ? this.formatUnixToTime(order.pay_time) : "" },
      { title: shipped ? "已发货" : "待发货", description: shipped ? this.formatUnixToTime(order.shipping_time) : "" },
    ];
    let current = 1;
    if (shipped) current = 3; else if (paid) current = 2; else current = 1;
    return { current, status: "process", steps };
  }

  private mapAddressData(addr: any) {
    if (!addr || typeof addr !== "object") return null;
    return {
      addressId: addr.address_id ?? addr.addressId ?? 0,
      addressTag: addr.address_tag ?? addr.addressTag ?? "",
      userId: addr.user_id ?? addr.userId ?? 0,
      consignee: addr.consignee ?? "",
      email: addr.email ?? "",
      regionIds: this.safeParseArray(addr.region_ids ?? addr.regionIds),
      regionNames: this.safeParseArray(addr.region_names ?? addr.regionNames),
      address: addr.address ?? "",
      postcode: addr.postcode ?? "",
      telephone: addr.telephone ?? "",
      mobile: addr.mobile ?? "",
      mobileAreaCode: addr.mobile_area_code ?? addr.mobileAreaCode ?? null,
      isDefault: addr.is_default ?? addr.isDefault ?? 0,
      isSelected: addr.is_selected ?? addr.isSelected ?? 0,
    };
  }

  private mapOrderExtension(ext: any) {
    if (!ext) return { couponAmount: [], discountAmount: [], shippingFee: [], shippingType: [] };
    return ext;
  }

  private getOrderStatusName(status: number) {
    switch (Number(status)) {
      case 0:
        return "待支付";
      case 1:
        return "待发货";
      case 2:
        return "已取消";
      case 3:
        return "已完成";
      default:
        return "";
    }
  }

  private getShippingStatusName(status: number) {
    switch (Number(status)) {
      case 0:
        return "待发货";
      case 1:
        return "已发货";
      case 2:
        return "部分发货";
      default:
        return "";
    }
  }

  private getPayStatusName(status: number) {
    switch (Number(status)) {
      case 0:
        return "待支付";
      case 1:
        return "已支付";
      case 2:
        return "已支付";
      default:
        return "";
    }
  }

  private getAvailableActions(orderStatus: number, payStatus: number, shippingStatus: number, isStoreSplited?: any) {
    const os = Number(orderStatus);
    const ps = Number(payStatus);
    const ss = Number(shippingStatus);
    const splited = Number(isStoreSplited || 0) === 1;
    const isPendingPay = os === 0 && ps === 0; // 待支付
    const isPaidUnshipped = ps === 1 && ss === 0; // 已支付待发货
    const isShipped = ss === 1; // 已发货
    const isCancelled = os === 2; // 已取消
    const isCompleted = os === 3; // 已完成

    return {
      setConfirm: isPendingPay,
      toPay: isPendingPay,
      setPaid: isPendingPay,
      setUnpaid: false,
      // 允许“待支付”或“已支付待发货”取消，但若已拆单则不允许
      cancelOrder: (isPendingPay || isPaidUnshipped) && !splited,
      delOrder: isCancelled,
      deliver: isPaidUnshipped,
      // 收货后不再显示确认按钮
      confirmReceipt: isShipped && !isCompleted && !isCancelled,
      splitOrder: false,
      // 修改订单仅允许待支付
      modifyOrder: isPendingPay,
      rebuy: false,
      modifyOrderMoney: isPendingPay,
      modifyOrderConsignee: !isCompleted && !isCancelled,
      modifyOrderProduct: false,
      // 配送信息仅允许待支付修改
      modifyShippingInfo: isPendingPay,
      toAftersales: ps >= 1,
      toComment: false,
    };
  }

  private formatMoney(v: any): string {
    const n = Number(v ?? 0);
    return n.toFixed(2);
  }

  private formatUnixToTime(v: any): string {
    const ts = Number(v || 0);
    if (!ts) return "";
    const d = new Date(ts * 1000);
    const pad = (x: number) => String(x).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  }

  private safeParseJson(s: any) {
    if (!s) return null;
    if (typeof s === "object") return s;
    try { return JSON.parse(String(s)); } catch { return null; }
  }

  private safeParseArray(s: any) {
    if (!s) return [];
    if (Array.isArray(s)) return s;
    if (typeof s === "object") return s as any[];
    try {
      const parsed = JSON.parse(String(s));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      const str = String(s);
      if (str.includes(",")) return str.split(",").map((x) => (isNaN(Number(x)) ? x : Number(x)));
      return [];
    }
  }

  private composeUserAddress(regionNames: any[], address: string) {
    const names = Array.isArray(regionNames) ? regionNames.filter(Boolean) : [];
    // 忽略“国家”层级，优先使用最后两个行政区（省/市 + 区/县），直辖市会自然变成“市 区”
    const filtered = names.filter((n) => n !== "中国");
    const lastTwo = filtered.length >= 2 ? filtered.slice(-2) : filtered;
    const prefix = lastTwo.join(" ");
    return prefix ? `${prefix} ${address || ""}`.trim() : address || "";
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
    // PHP 行为：确认收货 => order_status=3(已完成) + shipping_status=1(已发货) + received_time
    if (Number(order.order_status) === 3) {
      return true; // 幂等：已完成直接返回
    }
    if (Number(order.order_status) === 2) {
      throw new BadRequestException("已取消订单无法确认收货");
    }
    if (Number(order.shipping_status) === 0) {
      throw new BadRequestException("未发货订单不能确认收货");
    }
    const targetShipping = shippingStatus != null ? Number(shippingStatus) : 1;
    await this.prisma.order.update({
      where: { order_id: orderId },
      data: {
        order_status: 3,
        shipping_status: targetShipping === 0 ? 1 : targetShipping,
        received_time: now,
      },
    });
    await this.addLog(orderId, "确认收货，订单已完成", adminName);
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

  // 对齐 PHP：未发货阶段（shipping_status=0）取消时恢复库存
  const shouldRestore = Number(order.shipping_status) === 0;
    if (shouldRestore) {
      const items = await this.prisma.order_item.findMany({ where: { order_id: orderId } });
      const now = Math.floor(Date.now() / 1000);
      await this.prisma.$transaction(async (tx) => {
        for (const it of items as any[]) {
          const quantity = Number(it.quantity || 0);
          if (quantity <= 0) continue;
          const productId = Number(it.product_id || 0);
          const skuId = Number(it.sku_id || 0);
          const shopId = Number(it.shop_id || 0);
          const isGift = Number(it.is_gift || 0) === 1;

          if (isGift) {
            if (productId > 0) {
              const prod = await tx.product.findFirst({ where: { product_id: productId }, select: { product_stock: true } });
              if (prod) {
                const oldNum = Number(prod.product_stock || 0);
                const newNum = oldNum + quantity;
                await tx.product.updateMany({ where: { product_id: productId }, data: { product_stock: newNum } });
                await tx.product_inventory_log.create({
                  data: { product_id: productId, spec_id: 0, number: quantity, add_time: now, old_number: oldNum, type: true as any, change_number: quantity, desc: "取消订单恢复库存", shop_id: shopId },
                });
              }
            }
            continue;
          }

          if (skuId > 0) {
            const sku = await tx.product_sku.findUnique({ where: { sku_id: skuId }, select: { sku_stock: true, product_id: true } });
            if (sku) {
              const oldSku = Number(sku.sku_stock || 0);
              const newSku = oldSku + quantity;
              await tx.product_sku.update({ where: { sku_id: skuId }, data: { sku_stock: newSku } });

              const pId = Number(sku.product_id || productId || 0);
              if (pId > 0) {
                const prod = await tx.product.findFirst({ where: { product_id: pId }, select: { product_stock: true } });
                if (prod) {
                  const oldProd = Number(prod.product_stock || 0);
                  const newProd = oldProd + quantity;
                  await tx.product.updateMany({ where: { product_id: pId }, data: { product_stock: newProd } });
                  await tx.product_inventory_log.create({
                    data: { product_id: pId, spec_id: skuId, number: quantity, add_time: now, old_number: oldSku, type: true as any, change_number: quantity, desc: "取消订单恢复库存", shop_id: shopId },
                  });
                }
              }
            }
          } else if (productId > 0) {
            const prod = await tx.product.findFirst({ where: { product_id: productId }, select: { product_stock: true } });
            if (prod) {
              const oldNum = Number(prod.product_stock || 0);
              const newNum = oldNum + quantity;
              await tx.product.updateMany({ where: { product_id: productId }, data: { product_stock: newNum } });
              await tx.product_inventory_log.create({
                data: { product_id: productId, spec_id: 0, number: quantity, add_time: now, old_number: oldNum, type: true as any, change_number: quantity, desc: "取消订单恢复库存", shop_id: shopId },
              });
            }
          }
        }

        await tx.order.update({ where: { order_id: orderId }, data: { order_status: 2 } });
      });
    } else {
      const status = orderStatus != null ? Number(orderStatus) : 2; // 默认 2=已取消
      await this.prisma.order.update({ where: { order_id: orderId }, data: { order_status: status } });
    }

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
