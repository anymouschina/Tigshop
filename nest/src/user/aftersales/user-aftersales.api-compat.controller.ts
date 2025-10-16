// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RefundApplyService } from "../../finance/refund-apply/refund-apply.service";
import { OrderService } from "../../order/order.service";
import { PrismaService } from "src/prisma/prisma.service";
import {
  AFTERSALES_TYPE_NAME,
  STATUS_NAME,
  AftersalesStatus,
} from "src/order/aftersales.service";

@ApiTags("User Aftersales API Compat")
@Controller("api/user/aftersales")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserAftersalesApiCompatController {
  constructor(
    private readonly refundApplyService: RefundApplyService,
    private readonly orderService: OrderService,
    private readonly prisma: PrismaService,
  ) {}

  // 对齐 PHP：GET /api/user/aftersales/list
  @Get("list")
  @ApiOperation({ summary: "售后列表（兼容）" })
  async list(@Request() req, @Query() query: any) {
    const user_id = req.user.user_id ?? req.user.userId;
    const res = await this.refundApplyService.findAll({ ...query, user_id });
    return { code: 200, message: "OK", data: res };
  }

  // 对齐 PHP：GET /api/user/aftersales/config
  @Get("config")
  @ApiOperation({ summary: "售后配置（兼容）" })
  async config() {
    // 与旧 PHP /api/user/aftersales/config 对齐的固定配置
    return {
      code: 0,
      message: "success",
      data: {
        aftersaleType: {
          2: "仅退款",
          1: "退货/退款",
        },
        aftersaleReason: [
          "多拍/拍错/不喜欢",
          "未按约定时间发货",
          "协商一致退款",
          "地址/电话填错了",
          "其他",
        ],
      },
    };
  }

  // 对齐 PHP：GET /api/user/aftersales/applyData
  @Get("applyData")
  @ApiOperation({ summary: "获取售后申请基础数据（兼容）" })
  async applyData(
    @Request() req,
    @Query() query: { order_id?: number; orderId?: number },
  ) {
    const userId = req.user?.user_id ?? req.user?.userId;
    const oid = Number(query.order_id || query.orderId);
    if (!oid || !Number.isFinite(oid)) {
      return { code: 400, message: "缺少订单ID", data: null };
    }

    // 复用订单详情服务，保证字段与订单详情完全一致（含 availableActions、stepStatus 等）
    let order: any;
    try {
      order = await this.orderService.getOrderDetail(oid, userId);
    } catch (e: any) {
      return { code: 404, message: e?.message || "订单不存在", data: null };
    }

    // 生成可申请售后商品列表（过滤赠品 isGift=1; 已有售后 aftersalesItem!=null 的暂时不显示 -> 当前结构中 aftersalesItem 恒为 null, 预留逻辑）
    const list = Array.isArray(order.items)
      ? order.items
          .filter((it: any) => Number(it.isGift) === 0)
          .map((it: any) => ({
            itemId: it.itemId,
            picThumb: it.picThumb,
            isGift: it.isGift,
            productSn: it.productSn,
            productName: it.productName,
            price: it.price,
            quantity: it.quantity,
            subtotal: it.subtotal,
            skuData: it.skuData || [],
            canApplyQuantity: it.quantity, // 后续可减去已申请数量
          }))
      : [];

    return {
      code: 0,
      message: "success",
      data: {
        list,
        order,
      },
    };
  }

  // 对齐 PHP：POST /api/user/aftersales/create
  @Post("create")
  @ApiOperation({ summary: "创建售后（兼容）" })
  async create(@Request() req, @Body() body: any) {
    const user_id = req.user.user_id ?? req.user.userId;

    // 兼容前端传参（驼峰 -> 下划线）
    const order_id = body.order_id ?? body.orderId;
    if (!order_id) {
      return { code: 400, message: "缺少 orderId", data: null };
    }

    // 计算退款金额：若未显式提供 refund_amount，则基于选中商品行累加 price*number
    let refund_amount = body.refund_amount ?? body.refundAmount;
    let orderDetail: any = null;
    try {
      orderDetail = await this.orderService.getOrderDetail(
        Number(order_id),
        user_id,
      );
    } catch (e: any) {
      return { code: 404, message: e?.message || "订单不存在", data: null };
    }

    // 构建 itemId -> price 映射（价格为行单价）
    const priceMap: Record<string, number> = {};
    if (Array.isArray(orderDetail?.items)) {
      for (const it of orderDetail.items) {
        priceMap[String(it.itemId)] = Number(it.price) || 0;
      }
    }

    // 聚合前端传来的 items（可能字段名 orderItemId / order_item_id / itemId）
    let computed = 0;
    const rawItems: any[] = Array.isArray(body.items) ? body.items : [];
    const itemAggregates: Record<string, number> = {};
    for (const it of rawItems) {
      const key = it.order_item_id ?? it.orderItemId ?? it.itemId;
      if (!key) continue;
      const qty = Number(it.number ?? it.qty ?? it.quantity ?? 0) || 0;
      if (qty <= 0) continue;
      itemAggregates[key] = (itemAggregates[key] || 0) + qty;
    }
    // 限制每个条目的申请数量不超过订单原始可售后数量（目前=订单购买数量）
    const orderQtyMap: Record<string, number> = {};
    if (Array.isArray(orderDetail?.items)) {
      for (const it of orderDetail.items) {
        orderQtyMap[String(it.itemId)] = Number(it.quantity) || 0;
      }
    }
    for (const k of Object.keys(itemAggregates)) {
      const max = orderQtyMap[k] ?? Infinity;
      if (itemAggregates[k] > max) itemAggregates[k] = max;
      if (itemAggregates[k] <= 0) delete itemAggregates[k];
    }
    for (const itemId of Object.keys(itemAggregates)) {
      computed += (priceMap[itemId] || 0) * itemAggregates[itemId];
    }
    if (refund_amount === undefined || refund_amount === null) {
      refund_amount = Number(computed.toFixed(2));
    }

    // 上限保护：不可超过已支付金额（paid_amount）
    const paidAmountNum = Number(
      orderDetail?.paidAmount || orderDetail?.paid_amount || 0,
    );
    if (paidAmountNum > 0 && refund_amount > paidAmountNum) {
      refund_amount = paidAmountNum;
    }

    // 退款原因 / 类型映射
    const refund_reason =
      body.aftersale_reason ??
      body.aftersaleReason ??
      body.refund_reason ??
      body.refundReason ??
      "";
    const refund_type =
      body.aftersale_type ?? body.aftersaleType ?? body.refund_type ?? 0; // 2:仅退款 1:退货退款

    // 组装服务需要的数据结构
    const payload: any = {
      order_id: Number(order_id),
      refund_amount,
      refund_reason,
      refund_type,
      user_id,
      refund_note: refund_reason,
      refund_images: Array.isArray(body.pics)
        ? body.pics.join(",")
        : body.refund_images || "",
      // 兼容：如果需要后续细化线上/线下拆分，可在此扩展
    };

    // 生成售后单号（简单规则，可后续替换为更贴近旧系统的算法）
    const generateAftersalesSn = () => {
      const now = new Date();
      return (
        "AS" +
        now.getFullYear() +
        ("0" + (now.getMonth() + 1)).slice(-2) +
        ("0" + now.getDate()).slice(-2) +
        now.getTime().toString().slice(-5) +
        Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")
      );
    };

    // 事务：仅写入 aftersales 与 aftersales_item
    let createdAftersales: any;
    try {
      createdAftersales = await this.prisma.$transaction(async (tx) => {
        const add_time = Math.floor(Date.now() / 1000);
        const aftersales = await tx.aftersales.create({
          data: {
            aftersale_type: Number(refund_type) || 0,
            status: AftersalesStatus.IN_REVIEW,
            pics: Array.isArray(body.pics)
              ? JSON.stringify(body.pics)
              : body.pics || "[]",
            description: refund_reason || "",
            reply: "",
            add_time,
            tracking_no: "",
            logistics_name: "",
            return_address: null,
            aftersale_reason: refund_reason || "",
            aftersales_sn: generateAftersalesSn(),
            order_id: Number(order_id),
            user_id: user_id,
            refund_amount: refund_amount,
            shop_id: orderDetail?.shopId || orderDetail?.shop_id || 0,
            audit_time: 0,
            deal_time: 0,
            final_time: 0,
            return_goods_tip: "",
            vendor_id: orderDetail?.vendor_id || null,
          },
        });

        const aftersaleItemsData: any[] = Object.keys(itemAggregates).map(
          (itemId) => ({
            aftersale_id: aftersales.aftersale_id,
            order_item_id: Number(itemId),
            number: itemAggregates[itemId],
          }),
        );
        if (aftersaleItemsData.length) {
          await tx.aftersales_item.createMany({ data: aftersaleItemsData });
        }
        // 创建初始化日志（与旧 PHP 行为对齐）
        try {
          const typeName = refund_type == 2 ? "仅退款" : "退货退款";
          const logInfo =
            `会员发起了${typeName}: ${refund_reason || ""}`.trim();
          await tx.aftersales_log.create({
            data: {
              aftersale_id: aftersales.aftersale_id,
              log_info: logInfo,
              add_time,
              admin_name: "",
              refund_money: 0,
              refund_type: 0,
              refund_desc: refund_reason || logInfo,
              user_name: "",
              return_pic:
                Array.isArray(body.pics) && body.pics.length
                  ? JSON.stringify(body.pics)
                  : null,
            },
          });
        } catch {}
        return aftersales;
      });
    } catch (e: any) {
      return { code: 500, message: e?.message || "创建失败", data: null };
    }

    // 非阻塞：尝试同步创建 refund_apply；若已存在未完成申请则忽略
    try {
      await this.refundApplyService.create(payload);
    } catch (e: any) {
      if (!String(e?.message || "").includes("已有未完成")) {
        // 其它错误可记录日志；这里简单忽略
      }
    }

    // 组装返回
    const items = await this.prisma.aftersales_item.findMany({
      where: { aftersale_id: createdAftersales.aftersale_id },
    });
    const orderItemIds = items
      .map((it) => it.order_item_id)
      .filter(Boolean) as number[];
    const orderItems = orderItemIds.length
      ? await this.prisma.order_item.findMany({
          where: { item_id: { in: orderItemIds } },
        })
      : [];
    const orderItemMap = new Map(
      orderItems.map((oi) => [oi.item_id, oi] as const),
    );
    const orderSn = orderDetail?.orderSn || orderDetail?.order_sn || "";
    const aftersalesItems = items.map((it) =>
      this.composeAftersalesItem(
        it,
        orderItemMap.get(it.order_item_id as number),
        orderSn,
      ),
    );
    const record = this.composeAftersalesRecord(
      createdAftersales,
      orderSn,
      aftersalesItems,
    );
    return { code: 0, message: "success", data: record };
  }

  // 对齐 PHP：POST /api/user/aftersales/update
  @Post("update")
  @ApiOperation({ summary: "更新售后（兼容）" })
  async update(@Body() body: any) {
    // 映射 aftersale_id -> id；允许更新退款金额 / 状态
    const id = body.id ?? body.aftersale_id ?? body.refund_id;
    if (!id) {
      return { code: 400, message: "缺少 id", data: null };
    }
    const updatePayload: any = { id: Number(id) };
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.refund_amount !== undefined)
      updatePayload.refund_amount = Number(body.refund_amount);
    try {
      const updated = await this.refundApplyService.update(updatePayload);
      return { code: 0, message: "success", data: updated };
    } catch (e: any) {
      return { code: 500, message: e?.message || "更新失败", data: null };
    }
  }

  // 对齐 PHP：GET /api/user/aftersales/getRecord
  @Get("getRecord")
  @ApiOperation({ summary: "获取售后记录（兼容）" })
  async getRecord(@Request() req, @Query() query: any) {
    const userId = req.user?.user_id ?? req.user?.userId;
    const id = Number(query.id ?? query.aftersaleId ?? query.aftersale_id);
    if (id) {
      try {
        const record = await this.fetchAftersalesRecord(id, userId);
        if (!record) return { code: 404, message: "记录不存在", data: null };
        return { code: 0, message: "success", data: record };
      } catch (e: any) {
        return { code: 500, message: e?.message || "获取失败", data: null };
      }
    }
    const page = Math.max(1, Number(query.page || 1));
    const size = Math.min(50, Math.max(1, Number(query.size || 10)));
    const skip = (page - 1) * size;

    const [rows, total] = await Promise.all([
      this.prisma.aftersales.findMany({
        where: { user_id: userId },
        orderBy: { aftersale_id: "desc" },
        skip,
        take: size,
      }),
      this.prisma.aftersales.count({ where: { user_id: userId } }),
    ]);

    // Fallback：如果还没有迁移生成 aftersales 记录，则回退展示 refund_apply（只读转换）
    if (rows.length === 0) {
      const [refundRows, refundTotal] = await Promise.all([
        this.prisma.refund_apply.findMany({
          where: { user_id: userId },
          orderBy: { refund_id: "desc" },
          skip,
          take: size,
        }),
        this.prisma.refund_apply.count({ where: { user_id: userId } }),
      ]);
      if (refundRows.length) {
        const orderIds2 = Array.from(
          new Set(refundRows.map((r: any) => r.order_id).filter(Boolean)),
        );
        let orderSnMap2 = new Map<number, string>();
        if (orderIds2.length) {
          const orders2 = await this.prisma.order.findMany({
            where: { order_id: { in: orderIds2 as number[] } },
            select: { order_id: true, order_sn: true },
          });
          orderSnMap2 = new Map(
            orders2.map((o) => [o.order_id, o.order_sn] as const),
          );
        }
        const transformed = refundRows.map((r: any) => {
          // 粗略映射 refund_status -> aftersales status（可按需细化）
          let status = AftersalesStatus.IN_REVIEW; // 默认审核中
          if (r.refund_status === 2) status = AftersalesStatus.REFUSE; // 拒绝
          if (r.refund_status === 3) status = AftersalesStatus.CANCEL; // 已取消
          return this.composeAftersalesRecord(
            {
              aftersale_id: r.refund_id,
              aftersale_type: r.refund_type,
              status,
              pics: r.payment_voucher || "[]",
              description: r.refund_note || "",
              reply: "",
              add_time: r.add_time || 0,
              tracking_no: "",
              logistics_name: "",
              return_address: null,
              aftersale_reason: r.refund_note || "",
              aftersales_sn: "", // refund_apply 没有对应字段
              order_id: r.order_id,
              user_id: r.user_id,
              refund_amount: r.refund_balance || 0,
              shop_id: r.shop_id || 0,
              audit_time: 0,
              deal_time: 0,
              final_time: 0,
              return_goods_tip: "",
              vendor_id: 0,
            },
            orderSnMap2.get(r.order_id || 0) || "",
            [],
          );
        });
        return {
          code: 0,
          message: "success",
          data: { records: transformed, total: refundTotal },
        };
      }
    }

    // 预取涉及的订单号
    const orderIds = Array.from(
      new Set(rows.map((r: any) => r.order_id).filter(Boolean)),
    );
    let orderSnMap = new Map<number, string>();
    if (orderIds.length) {
      const orders = await this.prisma.order.findMany({
        where: { order_id: { in: orderIds as number[] } },
        select: { order_id: true, order_sn: true },
      });
      orderSnMap = new Map(
        orders.map((o) => [o.order_id, o.order_sn] as const),
      );
    }

    // 预取所有 aftersale_id 对应 items
    const aftersaleIds = rows.map((r: any) => r.aftersale_id);
    const items = aftersaleIds.length
      ? await this.prisma.aftersales_item.findMany({
          where: { aftersale_id: { in: aftersaleIds } },
        })
      : [];
    const orderItemIds = items
      .map((it) => it.order_item_id)
      .filter(Boolean) as number[];
    const orderItems = orderItemIds.length
      ? await this.prisma.order_item.findMany({
          where: { item_id: { in: orderItemIds } },
        })
      : [];
    const orderItemMap = new Map(
      orderItems.map((oi) => [oi.item_id, oi] as const),
    );
    const itemsByAftersale = new Map<number, any[]>();
    for (const it of items) {
      const arr = itemsByAftersale.get(it.aftersale_id as number) || [];
      const oi = orderItemMap.get(it.order_item_id as number);
      arr.push(
        this.composeAftersalesItem(
          it,
          oi,
          orderSnMap.get(oi?.order_id || 0) || "",
        ),
      );
      itemsByAftersale.set(it.aftersale_id as number, arr);
    }

    const records = rows.map((r) =>
      this.composeAftersalesRecord(
        r,
        orderSnMap.get(r.order_id || 0) || "",
        itemsByAftersale.get(r.aftersale_id) || [],
      ),
    );

    return {
      code: 0,
      message: "success",
      data: {
        records,
        total,
      },
    };
  }

  // 对齐 PHP：GET /api/user/aftersales/detail
  @Get("detail")
  @ApiOperation({ summary: "售后详情（兼容）" })
  async detail(@Query("id") id: number) {
    const userId = 0; // 用户ID可按需校验
    try {
      const record = await this.fetchAftersalesRecord(Number(id), userId);
      if (!record) return { code: 404, message: "记录不存在", data: null };
      return { code: 0, message: "success", data: record };
    } catch (e: any) {
      return { code: 500, message: e?.message || "获取失败", data: null };
    }
  }

  private async fetchAftersalesRecord(id: number, userId: number) {
    if (!id) return null;
    const record = await this.prisma.aftersales.findUnique({
      where: { aftersale_id: id },
    });
    if (!record) return null;
    if (userId && record.user_id && userId !== record.user_id) return null;
    const items = await this.prisma.aftersales_item.findMany({
      where: { aftersale_id: id },
    });
    const orderItemIds = items
      .map((it) => it.order_item_id)
      .filter(Boolean) as number[];
    const orderItems = orderItemIds.length
      ? await this.prisma.order_item.findMany({
          where: { item_id: { in: orderItemIds } },
        })
      : [];
    const orderItemMap = new Map(
      orderItems.map((oi) => [oi.item_id, oi] as const),
    );
    const order = record.order_id
      ? await this.prisma.order.findUnique({
          where: { order_id: record.order_id },
          select: { order_sn: true, order_id: true },
        })
      : null;
    const aftersalesItems = items.map((it) =>
      this.composeAftersalesItem(
        it,
        orderItemMap.get(it.order_item_id as number),
        order?.order_sn || "",
      ),
    );
    return this.composeAftersalesRecord(
      record,
      order?.order_sn || "",
      aftersalesItems,
    );
  }

  private composeAftersalesRecord(
    raw: any,
    orderSn: string,
    aftersalesItems: any[],
  ) {
    const toMoney = (v: any) => {
      if (v == null) return "0.00";
      if (typeof v === "number") return v.toFixed(2);
      if (typeof v === "string") return Number(v).toFixed(2);
      if (typeof v === "object" && Array.isArray(v.d)) {
        try {
          const digits = (v.d as number[]).join("");
          const e = v.e as number;
          const num = Number(digits) * Math.pow(10, e - digits.length + 1);
          return num.toFixed(2);
        } catch {
          return "0.00";
        }
      }
      return "0.00";
    };
    return {
      aftersalesTypeName:
        AFTERSALES_TYPE_NAME[raw.aftersale_type] ||
        AFTERSALES_TYPE_NAME[raw.aftersales_type] ||
        "",
      statusName: STATUS_NAME[raw.status] || "",
      aftersaleId:
        raw.aftersale_id ??
        raw.aftersale_id ??
        raw.aftersales_id ??
        raw.aftersale_id,
      aftersaleType: raw.aftersale_type ?? raw.aftersales_type ?? 0,
      status: raw.status,
      pics: raw.pics ? this.parsePics(raw.pics) : [],
      description: raw.description || "",
      reply: raw.reply || "",
      addTime: raw.add_time ? this.formatTime(raw.add_time) : "",
      trackingNo: raw.tracking_no || "",
      logisticsName: raw.logistics_name || "",
      returnAddress: raw.return_address || null,
      aftersaleReason: raw.aftersale_reason || raw.aftersale_reason || "",
      aftersalesSn: raw.aftersales_sn || "",
      orderId: raw.order_id,
      userId: raw.user_id,
      refundAmount: toMoney(raw.refund_amount),
      shopId: raw.shop_id ?? 0,
      auditTime: raw.audit_time ? this.formatTime(raw.audit_time) : "",
      dealTime: raw.deal_time ? this.formatTime(raw.deal_time) : "",
      finalTime: raw.final_time ? this.formatTime(raw.final_time) : "",
      returnGoodsTip: raw.return_goods_tip || "",
      vendorId: raw.vendor_id ?? null,
      orderSn,
      aftersalesItems,
    };
  }

  private composeAftersalesItem(link: any, oi: any, orderSn: string) {
    const maxQty = Number(oi?.quantity || oi?.goods_number || 0) || 0;
    const applied = Number(link.number || 0) || 0;
    return {
      aftersalesItemId: link.aftersales_item_id,
      orderItemId: link.order_item_id,
      number: applied > maxQty && maxQty > 0 ? maxQty : applied,
      aftersaleId: link.aftersale_id,
      orderSn,
      productName: oi?.product_name || oi?.productName || "",
      orderId: oi?.order_id,
      picThumb: oi?.pic_thumb || oi?.picThumb || "",
      productSn: oi?.product_sn || oi?.productSn || "",
      productId: oi?.product_id,
      quantity: oi?.quantity || oi?.goods_number || 0,
      price: this.normalizePrice(oi?.price),
    };
  }

  private normalizePrice(p: any) {
    if (p == null) return "0.00";
    if (typeof p === "number") return p.toFixed(2);
    if (typeof p === "string") return Number(p || 0).toFixed(2);
    if (typeof p === "object" && Array.isArray(p.d)) {
      try {
        const digits = (p.d as number[]).join("");
        const e = p.e as number;
        const num = Number(digits) * Math.pow(10, e - digits.length + 1);
        return num.toFixed(2);
      } catch {
        return "0.00";
      }
    }
    return "0.00";
  }

  private parsePics(pics: string) {
    // pics 可能是 JSON 或逗号分隔
    if (!pics) return [];
    try {
      const parsed = JSON.parse(pics);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return pics
      .split(",")
      .filter(Boolean)
      .map((p) => ({ picName: p, picThumb: p, picUrl: p }));
  }

  private formatTime(ts: number) {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    const pad = (n: number) => (n < 10 ? "0" + n : String(n));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // 对齐 PHP：GET /api/user/aftersales/detailLog
  @Get("detailLog")
  @ApiOperation({ summary: "售后日志（兼容）" })
  async detailLog(@Query("id") id: number) {
    const aftersaleId = Number(id);
    if (!aftersaleId) {
      return { code: 200, message: "OK", data: [] };
    }
    const logs = await this.prisma.aftersales_log.findMany({
      where: { aftersale_id: aftersaleId },
      orderBy: { log_id: "asc" },
    });
    const data = logs.map((l) => ({
      logId: l.log_id,
      adminName: l.admin_name || "",
      aftersalesId: l.aftersale_id || null,
      returnPic: l.return_pic || null,
      logInfo: l.log_info,
      refundDesc: l.refund_desc,
      refundMoney: Number(l.refund_money || 0),
      refundType: l.refund_type,
      userName: l.user_name || "",
      addTime: this.formatTime(l.add_time),
      shopId: 0,
      vendorId: 0,
    }));
    return { code: 200, message: "OK", data };
  }

  // 对齐 PHP：POST /api/user/aftersales/feedback
  @Post("feedback")
  @ApiOperation({ summary: "售后留言（兼容）" })
  async feedback(
    @Request() req,
    @Body() body: { id: number; content: string },
  ) {
    // 占位：可写入 refund_log，当前返回成功
    return { code: 200, message: "提交成功", data: true };
  }

  // 对齐 PHP：POST /api/user/aftersales/cancel
  @Post("cancel")
  @ApiOperation({ summary: "取消售后（兼容）" })
  async cancel(@Body() body: { id: number }) {
    // 将状态置为已取消(3)
    const updated = await this.refundApplyService.update({
      id: body.id,
      status: 3,
    });
    return { code: 200, message: "OK", data: updated };
  }
}
