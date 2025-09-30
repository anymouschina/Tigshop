// @ts-nocheck
import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";
import { Response } from "express";

@ApiTags("Admin API - 分销业绩结算(兼容)")
@Controller("adminapi/salesman/order")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanOrderCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  private toAmountStr(v: any, digits = 2): string {
    if (v == null) return (0).toFixed(digits);
    try {
      const n = typeof v === "number" ? v : Number(v as any);
      return Number.isFinite(n) ? n.toFixed(digits) : String(v ?? "0.00");
    } catch {
      return (0).toFixed(digits);
    }
  }

  private formatTime(ts?: number | null): string {
    const t = this.coerceNumber(ts, 0);
    if (!t) return "";
    const d = new Date(t * 1000);
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private parseMaybeJson<T = any>(v: any): T | any {
    if (v == null) return v;
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }

  private statusTextMap(status?: number | null) {
    const s = this.coerceNumber(status, 0);
    if (s === 1) return "已结算";
    if (s === 2) return "已拒绝";
    return "待结算";
  }

  @Get("list")
  @ApiOperation({ summary: "分销订单列表（兼容）" })
  @Authorities("performanceSettlementManage")
  async list(@Req() req: any, @Query() query: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    // 基础筛选（status/salesmanId/orderId/orderSn/keyword/时间区间/productId/itemId）
    const where: any = {};
    if (query.status !== undefined && query.status !== "") where.status = this.coerceNumber(query.status, 0);
    if (query.salesmanId) where.salesman_id = this.coerceNumber(query.salesmanId, 0);
    if (query.productId) where.product_id = this.coerceNumber(query.productId, 0);
    if (query.itemId) where.item_id = this.coerceNumber(query.itemId, 0);
    if (query.orderId) where.order_id = this.coerceNumber(query.orderId, 0);

    // 时间区间（下单时间/记录创建时间）
    const addTimeStart = this.coerceNumber(query.startTime || query.addTimeStart, 0);
    const addTimeEnd = this.coerceNumber(query.endTime || query.addTimeEnd, 0);
    if (addTimeStart || addTimeEnd) {
      where.add_time = {} as any;
      if (addTimeStart) where.add_time.gte = addTimeStart;
      if (addTimeEnd) where.add_time.lte = addTimeEnd;
    }
    const settlementTimeStart = this.coerceNumber(query.settlementStartTime, 0);
    const settlementTimeEnd = this.coerceNumber(query.settlementEndTime, 0);
    if (settlementTimeStart || settlementTimeEnd) {
      where.settlement_time = {} as any;
      if (settlementTimeStart) where.settlement_time.gte = settlementTimeStart;
      if (settlementTimeEnd) where.settlement_time.lte = settlementTimeEnd;
    }

    // 店铺/订单号/关键词 需要先定位允许的 order_id 集合
    const orderSn = (query.orderSn || "").trim();
    const keyword = (query.keyword || "").trim();
    let allowedOrderIds: number[] | undefined = undefined;
    if (shopId || orderSn || keyword) {
      let userIds: number[] = [];
      if (keyword) {
        const users = await this.prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: keyword } },
              { nickname: { contains: keyword } },
              { mobile: { contains: keyword } },
            ],
          },
          select: { user_id: true },
        });
        userIds = users.map((u) => u.user_id);
      }
      const ordersWhere: any = { ...(shopId ? { shop_id: shopId } : {}) };
      if (orderSn) ordersWhere.order_sn = { contains: orderSn };
      if (keyword) ordersWhere.OR = [{ order_sn: { contains: keyword } }, ...(userIds.length ? [{ user_id: { in: userIds } }] : [])];
      const orders = await this.prisma.order.findMany({ where: ordersWhere, select: { order_id: true } });
      allowedOrderIds = orders.map((o) => o.order_id);
      where.order_id = { in: allowedOrderIds.length ? allowedOrderIds : [-1] };
    }

    // 先计数再分页
    const total = await this.prisma.salesman_order.count({ where });
    const rows = await this.prisma.salesman_order.findMany({ where, orderBy: { salesman_order_id: "desc" }, skip, take: size });

    if (!rows.length)
      return { code: 0, message: "success", data: { records: [], total } };

    // 批量聚合相关 id
    const orderIds = Array.from(new Set(rows.map((r: any) => r.order_id).filter(Boolean)));
    const itemIds = Array.from(new Set(rows.map((r: any) => r.item_id).filter(Boolean)));
    const salesmanIds = Array.from(new Set(rows.map((r: any) => r.salesman_id).filter(Boolean)));
    const productIds = Array.from(new Set(rows.map((r: any) => r.product_id).filter(Boolean)));

    // 读取订单与按店铺过滤（若 allowedOrderIds 已限定，则无需再次按店铺过滤）
    const orders = orderIds.length
      ? await this.prisma.order.findMany({ where: { order_id: { in: orderIds }, ...(shopId && !allowedOrderIds ? { shop_id: shopId } : {}) } })
      : [];
    const orderMap = new Map(orders.map((o: any) => [o.order_id, o] as const));

    // 用户
    const userIds = Array.from(new Set(orders.map((o: any) => o.user_id).filter(Boolean)));
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { user_id: { in: userIds } }, select: { user_id: true, username: true, nickname: true, mobile: true, avatar: true, distribution_register_time: true } })
      : [];
    const userMap = new Map(users.map((u: any) => [u.user_id, u] as const));

    // 订单项
    const items = itemIds.length
      ? await this.prisma.order_item.findMany({ where: { item_id: { in: itemIds } } })
      : [];
    const itemMap = new Map(items.map((it: any) => [it.item_id, it] as const));

    // 分销员
    const salesmen = salesmanIds.length
      ? await this.prisma.salesman.findMany({ where: { salesman_id: { in: salesmanIds } } })
      : [];
    const salesmanMap = new Map(salesmen.map((s: any) => [s.salesman_id, s] as const));

    // 分销商品设置
    const salesmanProducts = productIds.length
      ? await this.prisma.salesman_product.findMany({ where: { product_id: { in: productIds } } })
      : [];
    const spMap = new Map(salesmanProducts.map((sp: any) => [sp.product_id, sp] as const));

    // 组装记录
    const records = rows
      .filter((r: any) => {
        // 若未在 where 中限定店铺，则在此处二次过滤
        if (shopId && !allowedOrderIds) {
          const o = orderMap.get(r.order_id);
          return !!o;
        }
        return true;
      })
      .map((r: any) => {
        const o = orderMap.get(r.order_id);
        const u = o ? userMap.get(o.user_id) : undefined;
        const it = r.item_id ? itemMap.get(r.item_id) : undefined;
        const sm = r.salesman_id ? salesmanMap.get(r.salesman_id) : undefined;
        const sp = r.product_id ? spMap.get(r.product_id) : undefined;

        // salesmanProductData：优先读取 salesman_order.salesman_product_data，否则基于 salesman_product 生成
        const rawSPD = this.parseMaybeJson<any>(r.salesman_product_data);
        const commissionData = rawSPD?.commissionData ?? this.parseMaybeJson<any>(sp?.commission_data) ?? {};
        const commissionType = this.coerceNumber(rawSPD?.commissionType ?? sp?.commission_type ?? 1, 1);
        const normalizeCommissionToLevels = (data: any) => {
          // 支持多种可能结构：[{levelArr:[{level,rate,downSalesmanRate}...]}] 或 {level1,level2,level3,level4}
          if (Array.isArray(data)) {
            const first = data[0];
            if (first && Array.isArray(first.levelArr)) return first.levelArr as any[];
            if (data.length && typeof data[0] === "object" && "level" in data[0] && "rate" in data[0]) return data as any[];
          }
          if (data && typeof data === "object") {
            const arr = [] as any[];
            for (let lv = 1; lv <= 4; lv++) {
              const k = (data as any)[`level${lv}`] ?? (data as any)[lv];
              if (k != null)
                arr.push({ level: lv, rate: String(k), downSalesmanRate: null });
            }
            return arr;
          }
          return [] as any[];
        };
        const levelArr: any[] = normalizeCommissionToLevels(commissionData);

        const productCommissionText = (() => {
          if (!levelArr.length) return "";
          const levelName = (lv: number) => (lv === 4 ? "钻石分销员" : lv === 3 ? "金牌分销员" : lv === 2 ? "银牌分销员" : "普通分销员");
          const parts = levelArr.map((lv) => `${levelName(this.coerceNumber(lv.level, 1))}佣金:${this.toAmountStr(lv.rate, commissionType === 1 ? 2 : 2)}${commissionType === 1 ? "%" : ""};`);
          return parts.join("");
        })();

        const profitComposition = (() => {
          if (!sm || !levelArr.length) return "";
          const found = levelArr.find((lv) => this.coerceNumber(lv.level, 0) === this.coerceNumber(sm.level, 0));
          return found ? this.toAmountStr(found.rate, 2) : "";
        })();

        const salesmanProductData = rawSPD || (sp
          ? {
              salesmanProductId: sp.salesman_product_id,
              productId: sp.product_id,
              isJoin: this.coerceNumber(sp.is_join, 0),
              commissionType,
              commissionData: levelArr.length ? [{ levelArr }] : [],
              addTime: sp.add_time ?? null,
              updateTime: sp.update_time ? this.formatTime(sp.update_time) : null,
              shopId: sp.shop_id ?? 0,
              productCommission: { productCommission: productCommissionText, subCommission: "" },
              salesman: sm
                ? {
                    salesmanId: sm.salesman_id,
                    userId: sm.user_id,
                    level: sm.level,
                    groupId: sm.group_id,
                    pid: sm.pid,
                    addTime: sm.add_time ?? 0, // 这里保持为数值，贴近示例中 salesmanProductData.salesman.addTime
                    shopId: sm.shop_id ?? 0,
                    saleAmount: this.coerceNumber(sm.sale_amount, 0),
                    orderSaleType: null,
                  }
                : null,
            }
          : null);

        const settlementData = this.parseMaybeJson<any>(r.salesman_settlement_data) || {
          id: null,
          shopId: null,
          code: null,
          saleType: null,
          level: null,
          settlementType: 1,
          dateType: 1,
          authorityCheckSubPermissionName: "salesmanConfigModifyManage",
          desc: "",
        };

        const orderUserInfo = o
          ? {
              orderId: o.order_id,
              orderSn: o.order_sn,
              userId: o.user_id,
              totalAmount: this.toAmountStr(o.total_amount),
              addTime: this.formatTime(o.add_time),
              payTime: this.formatTime(o.pay_time),
              orderStatus: o.order_status,
              orderSource: o.order_source,
              user: u
                ? {
                    username: u.username,
                    nickname: u.nickname,
                    userId: u.user_id,
                    mobile: u.mobile,
                  }
                : null,
            }
          : null;

        const userOrder = o
          ? {
              orderId: o.order_id,
              orderSn: o.order_sn,
              userId: o.user_id,
              parentOrderId: o.parent_order_id,
              parentOrderSn: o.parent_order_sn,
              orderStatus: o.order_status,
              shippingStatus: o.shipping_status,
              payStatus: o.pay_status,
              addTime: this.formatTime(o.add_time),
              consignee: o.consignee,
              address: o.address,
              regionIds: o.region_ids,
              regionNames: o.region_names,
              addressData: o.address_data,
              mobile: o.mobile,
              email: o.email,
              buyerNote: o.buyer_note,
              adminNote: o.admin_note,
              shippingMethod: o.shipping_method,
              logisticsId: o.logistics_id,
              logisticsName: o.logistics_name,
              shippingTypeId: o.shipping_type_id,
              shippingTypeName: o.shipping_type_name,
              trackingNo: o.tracking_no,
              shippingTime: this.formatTime(o.shipping_time),
              receivedTime: this.formatTime(o.received_time),
              payTypeId: o.pay_type_id,
              payTime: this.formatTime(o.pay_time),
              usePoints: o.use_points,
              isNeedCommisson: o.is_need_commisson ? 1 : 0,
              distributionStatus: o.distribution_status ? 1 : 0,
              referrerUserId: o.referrer_user_id,
              isDel: o.is_del,
              shopId: o.shop_id,
              isStoreSplited: o.is_store_splited,
              commentStatus: o.comment_status,
              totalAmount: this.toAmountStr(o.total_amount),
              paidAmount: this.toAmountStr(o.paid_amount),
              unpaidAmount: this.toAmountStr(o.unpaid_amount),
              unrefundAmount: this.toAmountStr(o.unrefund_amount),
              productAmount: this.toAmountStr(o.product_amount),
              couponAmount: this.toAmountStr(o.coupon_amount),
              pointsAmount: this.toAmountStr(o.points_amount),
              discountAmount: this.toAmountStr(o.discount_amount),
              balance: this.toAmountStr(o.balance),
              onlinePaidAmount: this.toAmountStr(o.online_paid_amount),
              offlinePaidAmount: this.toAmountStr(o.offline_paid_amount),
              serviceFee: this.toAmountStr(o.service_fee),
              shippingFee: this.toAmountStr(o.shipping_fee),
              invoiceFee: this.toAmountStr(o.invoice_fee),
              orderExtension: o.order_extension,
              orderSource: o.order_source,
              invoiceData: o.invoice_data ?? "",
              outTradeNo: o.out_trade_no ?? "",
              isSettlement: o.is_settlement ?? 0,
              isExchangeOrder: o.is_exchange_order ? 1 : 0,
              orderType: o.order_type ?? 1,
              mark: o.mark ?? 0,
              vendorId: o.vendor_id ?? null,
            }
          : null;

        const userOrderItem = it
          ? {
              itemId: it.item_id,
              orderId: it.order_id,
              orderSn: it.order_sn,
              userId: it.user_id,
              price: this.toAmountStr(it.price),
              quantity: it.quantity,
              productId: it.product_id,
              productName: it.product_name,
              productSn: it.product_sn,
              picThumb: it.pic_thumb,
              skuId: it.sku_id,
              skuData: it.sku_data,
              deliveryQuantity: it.delivery_quantity,
              productType: it.product_type,
              isGift: it.is_gift,
              shopId: it.shop_id,
              isPin: it.is_pin,
              prepayPrice: this.toAmountStr(it.prepay_price),
              commission: it.commission ?? "",
              originPrice: this.toAmountStr(it.origin_price),
              isSeckill: it.is_seckill ?? 0,
              extraSkuData: it.extra_sku_data ?? "",
              suppliersId: it.suppliers_id ?? 0,
              cardGroupName: it.card_group_name ?? "",
              vendorProductId: it.vendor_product_id ?? null,
              vendorProductSkuId: it.vendor_product_sku_id ?? null,
              vendorId: it.vendor_id ?? null,
              totalProductMoney: Number(this.toAmountStr(it.price)) * (it.quantity || 1),
            }
          : null;

        const baseUserInfo = u
          ? {
              mobile: u.mobile,
              username: u.username,
              nickname: u.nickname,
              avatar: u.avatar,
              userId: u.user_id,
              distributionRegisterTime: this.formatTime(u.distribution_register_time as any),
            }
          : null;

        const groupInfo = sm?.group_id
          ? { groupId: sm.group_id, groupName: undefined as any }
          : null;

        const record = {
          statusText: this.statusTextMap(r.status),
          salesmanOrderId: r.salesman_order_id,
          orderId: r.order_id,
          salesmanId: r.salesman_id,
          amount: this.toAmountStr(r.amount),
          status: this.coerceNumber(r.status, 0),
          addTime: this.formatTime(r.add_time),
          itemId: r.item_id,
          salesmanProductData,
          orderAmount: this.toAmountStr(r.order_amount),
          salesmanSettlementData: settlementData,
          settlementTime: this.formatTime(r.settlement_time),
          productId: r.product_id,
          profitComposition,
          salesman: sm
            ? {
                salesmanId: sm.salesman_id,
                userId: sm.user_id,
                level: sm.level,
                groupId: sm.group_id,
                pid: sm.pid,
                addTime: this.formatTime(sm.add_time),
                shopId: sm.shop_id ?? 0,
                saleAmount: this.toAmountStr(sm.sale_amount),
                baseUserInfo,
                groupInfo,
                shopInfo: null,
                pidUserInfo: null,
              }
            : null,
          orderUserInfo,
          userOrder,
          userOrderItem,
        };

        // 回填分组名（如需）：简单方式按 group_id 查一次
        return record;
      });

    // 若需要 groupName，可在此追加轻量查询（避免 N+1）
    const groupIds = Array.from(new Set(records.map((r: any) => r?.salesman?.groupId).filter(Boolean)));
    if (groupIds.length) {
      const groups = await this.prisma.salesman_group.findMany({ where: { group_id: { in: groupIds } }, select: { group_id: true, group_name: true } });
      const gmap = new Map(groups.map((g) => [g.group_id, g.group_name] as const));
      for (const rec of records as any[]) {
        if (rec?.salesman?.groupId && rec.salesman.groupInfo) {
          rec.salesman.groupInfo.groupName = gmap.get(rec.salesman.groupId) || "";
        }
      }
    }

    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("export")
  @ApiOperation({ summary: "导出分销订单（兼容，CSV）" })
  @Authorities("performanceSettlementManage")
  async export(@Req() req: any, @Query() query: any, @Res() res: Response) {
    // 复用 list 的筛选逻辑但不分页，设置最大导出条数以防过大
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const limit = Math.min(Math.max(this.coerceNumber(query.limit, 5000), 1), 20000);

    const where: any = {};
    if (query.status !== undefined && query.status !== "") where.status = this.coerceNumber(query.status, 0);
    if (query.salesmanId) where.salesman_id = this.coerceNumber(query.salesmanId, 0);
    if (query.productId) where.product_id = this.coerceNumber(query.productId, 0);
    if (query.itemId) where.item_id = this.coerceNumber(query.itemId, 0);
    if (query.orderId) where.order_id = this.coerceNumber(query.orderId, 0);
    const addTimeStart = this.coerceNumber(query.startTime || query.addTimeStart, 0);
    const addTimeEnd = this.coerceNumber(query.endTime || query.addTimeEnd, 0);
    if (addTimeStart || addTimeEnd) {
      where.add_time = {} as any;
      if (addTimeStart) where.add_time.gte = addTimeStart;
      if (addTimeEnd) where.add_time.lte = addTimeEnd;
    }
    const settlementTimeStart = this.coerceNumber(query.settlementStartTime, 0);
    const settlementTimeEnd = this.coerceNumber(query.settlementEndTime, 0);
    if (settlementTimeStart || settlementTimeEnd) {
      where.settlement_time = {} as any;
      if (settlementTimeStart) where.settlement_time.gte = settlementTimeStart;
      if (settlementTimeEnd) where.settlement_time.lte = settlementTimeEnd;
    }

    const orderSn = (query.orderSn || "").trim();
    const keyword = (query.keyword || "").trim();
    let allowedOrderIds: number[] | undefined = undefined;
    if (shopId || orderSn || keyword) {
      let userIds: number[] = [];
      if (keyword) {
        const users = await this.prisma.user.findMany({
          where: { OR: [{ username: { contains: keyword } }, { nickname: { contains: keyword } }, { mobile: { contains: keyword } }] },
          select: { user_id: true },
        });
        userIds = users.map((u) => u.user_id);
      }
      const ordersWhere: any = { ...(shopId ? { shop_id: shopId } : {}) };
      if (orderSn) ordersWhere.order_sn = { contains: orderSn };
      if (keyword) ordersWhere.OR = [{ order_sn: { contains: keyword } }, ...(userIds.length ? [{ user_id: { in: userIds } }] : [])];
      const orders = await this.prisma.order.findMany({ where: ordersWhere, select: { order_id: true } });
      allowedOrderIds = orders.map((o) => o.order_id);
      where.order_id = { in: allowedOrderIds.length ? allowedOrderIds : [-1] };
    }

    const rows = await this.prisma.salesman_order.findMany({ where, orderBy: { salesman_order_id: "desc" }, take: limit });

    // 关联数据
    const orderIds = Array.from(new Set(rows.map((r: any) => r.order_id).filter(Boolean)));
    const itemIds = Array.from(new Set(rows.map((r: any) => r.item_id).filter(Boolean)));
    const salesmanIds = Array.from(new Set(rows.map((r: any) => r.salesman_id).filter(Boolean)));

    const orders = orderIds.length ? await this.prisma.order.findMany({ where: { order_id: { in: orderIds } } }) : [];
    const orderMap = new Map(orders.map((o: any) => [o.order_id, o] as const));
    const usersIds = Array.from(new Set(orders.map((o: any) => o.user_id).filter(Boolean)));
    const users = usersIds.length ? await this.prisma.user.findMany({ where: { user_id: { in: usersIds } }, select: { user_id: true, username: true, nickname: true, mobile: true } }) : [];
    const userMap = new Map(users.map((u: any) => [u.user_id, u] as const));
    const items = itemIds.length ? await this.prisma.order_item.findMany({ where: { item_id: { in: itemIds } } }) : [];
    const itemMap = new Map(items.map((it: any) => [it.item_id, it] as const));
    const salesmen = salesmanIds.length ? await this.prisma.salesman.findMany({ where: { salesman_id: { in: salesmanIds } } }) : [];
    const salesmanMap = new Map(salesmen.map((s: any) => [s.salesman_id, s] as const));

    // 构造 CSV 行
    const header = [
      "salesmanOrderId",
      "orderSn",
      "orderId",
      "itemId",
      "productId",
      "productName",
      "skuId",
      "quantity",
      "price",
      "totalProductMoney",
      "salesmanId",
      "salesmanLevel",
      "salesmanUsername",
      "salesmanNickname",
      "statusText",
      "amount",
      "orderAmount",
      "addTime",
      "settlementTime",
      "customerUsername",
      "customerNickname",
      "customerMobile",
    ];

    const esc = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };

    const lines = [header.join(",")];
    for (const r of rows) {
      const o = orderMap.get(r.order_id);
      const it = r.item_id ? itemMap.get(r.item_id) : undefined;
      const sm = r.salesman_id ? salesmanMap.get(r.salesman_id) : undefined;
      const u = o ? userMap.get(o.user_id) : undefined;
      const row = [
        r.salesman_order_id,
        o?.order_sn ?? "",
        r.order_id ?? "",
        r.item_id ?? "",
        r.product_id ?? "",
        it?.product_name ?? "",
        it?.sku_id ?? "",
        it?.quantity ?? "",
        this.toAmountStr(it?.price),
        it ? Number(this.toAmountStr(it.price)) * (it.quantity || 1) : 0,
        r.salesman_id ?? "",
        sm?.level ?? "",
        "",
        "",
        this.statusTextMap(r.status),
        this.toAmountStr(r.amount),
        this.toAmountStr(r.order_amount),
        this.formatTime(r.add_time),
        this.formatTime(r.settlement_time),
        u?.username ?? "",
        u?.nickname ?? "",
        u?.mobile ?? "",
      ].map(esc);
      lines.push(row.join(","));
    }

    const csv = "\ufeff" + lines.join("\r\n");
    const buf = Buffer.from(csv, "utf8");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Length", String(buf.length));
    const filename = `salesman-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.end(buf);
  }
}
