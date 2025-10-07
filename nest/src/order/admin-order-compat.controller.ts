// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards, Req, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { AdminOrderCompatService } from "./admin-order-compat.service";
import { AftersalesService, AFTERSALES_TYPE_NAME, STATUS_NAME } from "./aftersales.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 订单(兼容路径)")
@Controller("adminapi/order")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminOrderCompatController {
  constructor(
    private readonly svc: AdminOrderCompatService,
    private readonly aftersalesSvc: AftersalesService,
    private readonly panelService: PanelService,
  ) {}

  @Get("list")
  @Authorities("order")
  @ApiOperation({ summary: "订单列表（admin 兼容）" })
  async list(@Query() query: any, @Req() req: any) {
    // 解析 header X-Shop-Id（优先），兼容 query 中的 shopId / shop_id
    const headerShopIdRaw = req.headers["x-shop-id"] ?? req.headers["x-shopid"];
    const resolvedShopId = Number(headerShopIdRaw ?? query.shopId ?? query.shop_id);
    if (Number.isFinite(resolvedShopId) && resolvedShopId > 0) {
      // 将解析好的 shopId 写回 query，供 service 使用
      query.shopId = resolvedShopId;
    }
    const data = await this.svc.list(query);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/list
  @Get("order/list")
  @Authorities("order")
  @ApiOperation({ summary: "订单列表（admin 兼容 - PHP 路径别名）" })
  async listAlias(@Query() query: any, @Req() req: any) {
    return this.list(query, req);
  }

  @Get("detail")
  @Authorities("order")
  @ApiOperation({ summary: "订单详情（admin 兼容）" })
  async detail(@Query("id") id: string) {
    const data = await this.svc.detail(Number(id));
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/detail
  @Get("order/detail")
  @Authorities("order")
  @ApiOperation({ summary: "订单详情（admin 兼容 - PHP 路径别名）" })
  async detailAlias(@Query("id") id: string) {
    return this.detail(id);
  }

  @Post("updateField")
  @Authorities("order")
  @ApiOperation({ summary: "更新订单字段/状态（admin 兼容）" })
  async updateField(@Body() body: any) {
    const id = Number(body.id);
    const field = body.field;
    const val = body.val ?? body.value;
    await this.svc.updateField(id, field, val);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/updateField
  @Post("order/updateField")
  @Authorities("order")
  @ApiOperation({ summary: "更新订单字段/状态（admin 兼容 - PHP 路径别名）" })
  async updateFieldAlias(@Body() body: any) {
    return this.updateField(body);
  }

  @Get("log/list")
  @Authorities("order")
  @ApiOperation({ summary: "订单日志列表（admin 兼容）" })
  async logList(@Query() query: any) {
    const id = Number(query.id ?? query.orderId);
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const data = await this.svc.getLogs(id, page, size);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/log/list
  @Get("order/log/list")
  @Authorities("order")
  @ApiOperation({ summary: "订单日志列表（admin 兼容 - PHP 路径别名）" })
  async logListAlias(@Query() query: any) {
    return this.logList(query);
  }

  // 兼容 PHP: /adminapi/order/orderLog/list
  @Get("orderLog/list")
  @Authorities("order")
  @ApiOperation({ summary: "订单日志列表（admin 兼容 - PHP 路径别名）" })
  async orderLogList(@Query() query: any) {
    return this.logList(query);
  }

  @Post("log/create")
  @Authorities("order")
  @ApiOperation({ summary: "新增订单日志（admin 兼容）" })
  async logCreate(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    const content = String(body.content ?? body.remark ?? "");
    const adminName = req?.user?.username ?? "admin";
    await this.svc.addLog(id, content, adminName);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/log/create
  @Post("order/log/create")
  @Authorities("order")
  @ApiOperation({ summary: "新增订单日志（admin 兼容 - PHP 路径别名）" })
  async logCreateAlias(@Body() body: any, @Req() req: any) {
    return this.logCreate(body, req);
  }

  // 兼容 PHP: /adminapi/order/orderLog/create
  @Post("orderLog/create")
  @Authorities("order")
  @ApiOperation({ summary: "新增订单日志（admin 兼容 - PHP 路径别名）" })
  async orderLogCreate(@Body() body: any, @Req() req: any) {
    return this.logCreate(body, req);
  }

  @Post("saveExportItem")
  @Authorities("order")
  @ApiOperation({ summary: "保存订单导出字段设置（admin 兼容）" })
  async saveExportItem(@Body() body: any, @Req() req: any) {
    const adminId = req?.user?.userId ?? 0;
    let items = body.export_item ?? body.items ?? [];
    if (!Array.isArray(items)) {
      items = String(items).split(",").filter(Boolean);
    }
    await this.svc.saveExportItem(adminId, items);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/saveExportItem
  @Post("order/saveExportItem")
  @Authorities("order")
  @ApiOperation({ summary: "保存订单导出字段设置（admin 兼容 - PHP 路径别名）" })
  async saveExportItemAlias(@Body() body: any, @Req() req: any) {
    return this.saveExportItem(body, req);
  }

  // -------- Aftersales（兼容路由占位，先消除 404） --------
  @Get("aftersales/list")
  @Authorities("order")
  @ApiOperation({ summary: "售后列表（admin 兼容，占位）" })
  async aftersalesList(@Query() query: any, @Req() req: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const adminId = req?.user?.userId ?? 0;
    const [shopId, vendorId] = await Promise.all([
      this.panelService.getUserShopId(adminId),
      this.panelService.getUserVendorId(adminId),
    ]);
    const filter: any = {
      keyword: query.keyword,
      page,
      size,
      status: query.status ? Number(query.status) : 0,
      aftersale_type: query.aftersale_type ? Number(query.aftersale_type) : 0,
      shop_id: shopId,
      vendor_id: vendorId,
    };
    const [records, total] = await Promise.all([
      this.aftersalesSvc.getFilterResult(filter),
      this.aftersalesSvc.getFilterCount(filter),
    ]);
    const data = { records, total, size, current: page, pages: Math.max(1, Math.ceil((total || 0) / size)) };
    return { code: 0, message: "success", data };
  }

  @Get("aftersales/applyType")
  @Authorities("order")
  @ApiOperation({ summary: "售后申请类型（占位）" })
  async aftersalesApplyType() {
    return { code: 0, message: "success", data: AFTERSALES_TYPE_NAME };
  }

  @Get("aftersales/returnGoodsStatus")
  @Authorities("order")
  @ApiOperation({ summary: "售后退换货状态（占位）" })
  async aftersalesReturnGoodsStatus() {
    // TODO: 依据是否供应商模式裁剪 21/22/23
    return { code: 0, message: "success", data: STATUS_NAME };
  }

  @Get("aftersales/detail")
  @Authorities("order")
  @ApiOperation({ summary: "售后详情（占位）" })
  async aftersalesDetail(@Query("id") id: string) {
    const data = await this.aftersalesSvc.getDetail(Number(id));
    return { code: 0, message: "success", data };
  }

  @Post("aftersales/update")
  @Authorities("order")
  @ApiOperation({ summary: "售后更新（占位）" })
  async aftersalesUpdate(@Body() body: any, @Req() req: any) {
    // 同意或拒绝：status, reply, return_address, refund_amount, admin_id
    const ok = await this.aftersalesSvc.agreeOrRefuse(Number(body.aftersale_id ?? body.id), {
      status: Number(body.status),
      reply: body.reply,
      return_address: body.return_address ?? body.returnAddress,
      refund_amount: body.refund_amount ?? body.refundAmount,
      admin_id: req?.user?.userId ?? 0,
      admin_name: req?.user?.username ?? "admin",
    });
    return ok ? { code: 0, message: "success" } : { code: 1, message: "error" };
  }

  @Post("aftersales/receive")
  @Authorities("order")
  @ApiOperation({ summary: "售后确认收货（占位）" })
  async aftersalesReceive(@Body() body: any, @Req() req: any) {
    // 简化：将状态置为 RETURNED(5)
    const ok = await this.aftersalesSvc.agreeOrRefuse(Number(body.aftersale_id ?? body.id), {
      status: 5,
      reply: body.reply ?? "",
      admin_id: req?.user?.userId ?? 0,
      admin_name: req?.user?.username ?? "admin",
    });
    return ok ? { code: 0, message: "success" } : { code: 1, message: "error" };
  }

  @Post("aftersales/record")
  @Authorities("order")
  @ApiOperation({ summary: "售后反馈记录（占位）" })
  async aftersalesRecord(@Body() body: any, @Req() req: any) {
    // 记录日志
    await this.aftersalesSvc.addLog(Number(body.aftersale_id ?? body.id), {
      admin_name: req?.user?.username ?? "admin",
      log_info: body.action ?? "备注",
      refund_desc: body.action_desc ?? body.remark ?? body.content ?? "",
    });
    return { code: 0, message: "success" };
  }

  @Post("aftersales/complete")
  @Authorities("order")
  @ApiOperation({ summary: "售后完结（占位）" })
  async aftersalesComplete(@Body() body: any, @Req() req: any) {
    const ok = await this.aftersalesSvc.complete(Number(body.id ?? body.aftersale_id), req?.user?.userId ?? 0);
    return ok ? { code: 0, message: "success" } : { code: 1, message: "error" };
  }

  // -------- 订单管理常用操作（占位） --------
  @Get("orderWayBill")
  @Authorities("order")
  @ApiOperation({ summary: "获取电子面单（占位）" })
  async orderWayBill(@Query("id") id: string) {
    const data = await this.svc.getOrderWayBill(Number(id));
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/orderWayBill
  @Get("order/orderWayBill")
  @Authorities("order")
  @ApiOperation({ summary: "获取电子面单（admin 兼容 - PHP 路径别名）" })
  async orderWayBillAlias() { return this.orderWayBill(); }

  @Get("parentDetail")
  @Authorities("order")
  @ApiOperation({ summary: "父订单详情（占位）" })
  async parentDetail(@Query("id") id: string) {
    const data = await this.svc.getParentDetail(Number(id));
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/parentDetail
  @Get("order/parentDetail")
  @Authorities("order")
  @ApiOperation({ summary: "父订单详情（admin 兼容 - PHP 路径别名）" })
  async parentDetailAlias(@Query("id") id: string) { return this.parentDetail(id); }

  @Post("deliver")
  @Authorities("order")
  @ApiOperation({ summary: "订单发货（占位）" })
  async deliver(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.deliver(id, {
      trackingNo: body.trackingNo ?? body.tracking_no,
      logisticsId: body.logisticsId ?? body.logistics_id,
      logisticsName: body.logisticsName ?? body.logistics_name,
      shippingStatus: body.shippingStatus ?? body.shipping_status,
    }, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/deliver
  @Post("order/deliver")
  @Authorities("order")
  @ApiOperation({ summary: "订单发货（admin 兼容 - PHP 路径别名）" })
  async deliverAlias(@Body() body: any, @Req() req: any) { return this.deliver(body, req); }

  @Post("confirmReceipt")
  @Authorities("order")
  @ApiOperation({ summary: "订单收货（占位）" })
  async confirmReceipt(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.confirmReceipt(id, body.shippingStatus ?? body.shipping_status, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/confirmReceipt
  @Post("order/confirmReceipt")
  @Authorities("order")
  @ApiOperation({ summary: "订单收货（admin 兼容 - PHP 路径别名）" })
  async confirmReceiptAlias(@Body() body: any, @Req() req: any) { return this.confirmReceipt(body, req); }

  @Post("modifyConsignee")
  @Authorities("order")
  @ApiOperation({ summary: "修改收货人信息（占位）" })
  async modifyConsignee(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.modifyConsignee(id, body, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/modifyConsignee
  @Post("order/modifyConsignee")
  @Authorities("order")
  @ApiOperation({ summary: "修改收货人信息（admin 兼容 - PHP 路径别名）" })
  async modifyConsigneeAlias(@Body() body: any, @Req() req: any) { return this.modifyConsignee(body, req); }

  @Post("modifyShipping")
  @Authorities("order")
  @ApiOperation({ summary: "修改配送信息（占位）" })
  async modifyShipping(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.modifyShipping(id, body, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/modifyShipping
  @Post("order/modifyShipping")
  @Authorities("order")
  @ApiOperation({ summary: "修改配送信息（admin 兼容 - PHP 路径别名）" })
  async modifyShippingAlias(@Body() body: any, @Req() req: any) { return this.modifyShipping(body, req); }

  @Post("modifyMoney")
  @Authorities("order")
  @ApiOperation({ summary: "修改订单金额（占位）" })
  async modifyMoney(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.modifyMoney(id, body, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/modifyMoney
  @Post("order/modifyMoney")
  @Authorities("order")
  @ApiOperation({ summary: "修改订单金额（admin 兼容 - PHP 路径别名）" })
  async modifyMoneyAlias(@Body() body: any, @Req() req: any) { return this.modifyMoney(body, req); }

  @Post("cancelOrder")
  @Authorities("order")
  @ApiOperation({ summary: "取消订单（占位）" })
  async cancelOrder(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.cancelOrder(id, body.reason ?? body.remark, body.orderStatus ?? body.order_status, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/cancelOrder
  @Post("order/cancelOrder")
  @Authorities("order")
  @ApiOperation({ summary: "取消订单（admin 兼容 - PHP 路径别名）" })
  async cancelOrderAlias(@Body() body: any, @Req() req: any) { return this.cancelOrder(body, req); }

  @Post("setConfirm")
  @Authorities("order")
  @ApiOperation({ summary: "设置为已确认（占位）" })
  async setConfirm(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.setConfirm(id, body.orderStatus ?? body.order_status, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/setConfirm
  @Post("order/setConfirm")
  @Authorities("order")
  @ApiOperation({ summary: "设置为已确认（admin 兼容 - PHP 路径别名）" })
  async setConfirmAlias(@Body() body: any, @Req() req: any) { return this.setConfirm(body, req); }

  @Post("delOrder")
  @Authorities("order")
  @ApiOperation({ summary: "订单软删除（占位）" })
  async delOrder(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.delOrder(id, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/delOrder
  @Post("order/delOrder")
  @Authorities("order")
  @ApiOperation({ summary: "订单软删除（admin 兼容 - PHP 路径别名）" })
  async delOrderAlias(@Body() body: any, @Req() req: any) { return this.delOrder(body, req); }

  @Post("splitStoreOrder")
  @Authorities("order")
  @ApiOperation({ summary: "订单拆分（按店铺/供应商自动拆分并分摊金额）" })
  async splitStoreOrder(@Body() body: any) {
    const id = Number(body.id ?? body.orderId);
    if (!id) return { code: 400, message: "缺少订单ID", data: false };
    await this.svc.splitStoreOrder(id);
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: /adminapi/order/order/splitStoreOrder
  @Post("order/splitStoreOrder")
  @Authorities("order")
  @ApiOperation({ summary: "订单拆分（admin 兼容 - PHP 路径别名）" })
  async splitStoreOrderAlias(@Body() body: any) { return this.splitStoreOrder(body); }

  @Post("setPaid")
  @Authorities("order")
  @ApiOperation({ summary: "设置为已支付（占位）" })
  async setPaid(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.setPaid(id, body.payStatus ?? body.pay_status, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/setPaid
  @Post("order/setPaid")
  @Authorities("order")
  @ApiOperation({ summary: "设置为已支付（admin 兼容 - PHP 路径别名）" })
  async setPaidAlias(@Body() body: any, @Req() req: any) { return this.setPaid(body, req); }

  @Post("modifyProduct")
  @Authorities("order")
  @ApiOperation({ summary: "修改商品信息（占位）" })
  async modifyProduct(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.modifyProduct(id, body, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/modifyProduct
  @Post("order/modifyProduct")
  @Authorities("order")
  @ApiOperation({ summary: "修改商品信息（admin 兼容 - PHP 路径别名）" })
  async modifyProductAlias(@Body() body: any, @Req() req: any) { return this.modifyProduct(body, req); }

  @Post("getAddProductInfo")
  @Authorities("order")
  @ApiOperation({ summary: "添加商品前置信息（占位）" })
  async getAddProductInfo(@Body() body: any) {
    const id = Number(body.id ?? body.orderId);
    const data = await this.svc.getAddProductInfo(id);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/getAddProductInfo
  @Post("order/getAddProductInfo")
  @Authorities("order")
  @ApiOperation({ summary: "添加商品前置信息（admin 兼容 - PHP 路径别名）" })
  async getAddProductInfoAlias(@Body() body: any) { return this.getAddProductInfo(body); }

  @Post("setAdminNote")
  @Authorities("order")
  @ApiOperation({ summary: "设置商家备注（占位）" })
  async setAdminNote(@Body() body: any, @Req() req: any) {
    const id = Number(body.id ?? body.orderId);
    await this.svc.setAdminNote(id, body.note ?? body.adminNote ?? body.admin_note, req?.user?.username);
    return { code: 0, message: "success" };
  }

  // 兼容 PHP: /adminapi/order/order/setAdminNote
  @Post("order/setAdminNote")
  @Authorities("order")
  @ApiOperation({ summary: "设置商家备注（admin 兼容 - PHP 路径别名）" })
  async setAdminNoteAlias(@Body() body: any, @Req() req: any) { return this.setAdminNote(body, req); }

  @Get("orderPrint")
  @Authorities("order")
  @ApiOperation({ summary: "打印订单（占位）" })
  async orderPrint(@Query("id") id: string) {
    const data = await this.svc.getOrderPrintData(Number(id));
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/orderPrint
  @Get("order/orderPrint")
  @Authorities("order")
  @ApiOperation({ summary: "打印订单（admin 兼容 - PHP 路径别名）" })
  async orderPrintAlias() { return this.orderPrint(); }

  @Get("orderPrintBill")
  @Authorities("order")
  @ApiOperation({ summary: "打印电子面单（占位）" })
  async orderPrintBill(@Query("id") id: string) {
    const data = await this.svc.getOrderPrintBill(Number(id));
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/orderPrintBill
  @Get("order/orderPrintBill")
  @Authorities("order")
  @ApiOperation({ summary: "打印电子面单（admin 兼容 - PHP 路径别名）" })
  async orderPrintBillAlias() { return this.orderPrintBill(); }

  @Get("getExportItemList")
  @Authorities("order")
  @ApiOperation({ summary: "导出标签列表（占位）" })
  async getExportItemList() {
    const data = await this.svc.getExportItemList();
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/getExportItemList
  @Get("order/getExportItemList")
  @Authorities("order")
  @ApiOperation({ summary: "导出标签列表（admin 兼容 - PHP 路径别名）" })
  async getExportItemListAlias() { return this.getExportItemList(); }

  @Get("exportItemInfo")
  @Authorities("order")
  @ApiOperation({ summary: "标签详情（占位）" })
  async exportItemInfo(@Req() req: any) {
    const adminId = req?.user?.userId ?? 0;
    const data = await this.svc.getExportItemInfo(adminId);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/exportItemInfo
  @Get("order/exportItemInfo")
  @Authorities("order")
  @ApiOperation({ summary: "标签详情（admin 兼容 - PHP 路径别名）" })
  async exportItemInfoAlias(@Req() req: any) { return this.exportItemInfo(req); }

  @Get("orderExport")
  @Authorities("order")
  @ApiOperation({ summary: "订单导出（占位）" })
  async orderExport(@Query() query: any, @Req() req: any, @Res() res: Response) {
    // 获取导出字段：优先 query.fields，其次个人偏好，其次默认
    let fields: string[] = [];
    const raw = query.fields ?? query.export_item;
    if (raw) {
      if (Array.isArray(raw)) fields = raw.map(String);
      else if (typeof raw === "string") {
        try { const arr = JSON.parse(raw); if (Array.isArray(arr)) fields = arr.map(String); else fields = String(raw).split(',').map((s) => s.trim()).filter(Boolean); }
        catch { fields = String(raw).split(',').map((s) => s.trim()).filter(Boolean); }
      }
    }
    if (!fields.length) fields = await this.svc.getExportItemInfo(req?.user?.userId ?? 0);
    const { headers, rows } = await this.svc.buildOrderExportRows(query, fields);
    // 生成 CSV（BOM + CRLF）
    const esc = (v: string) => {
      const s = v == null ? "" : String(v);
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines: string[] = [];
    lines.push(headers.map(esc).join(','));
    for (const r of rows) lines.push(r.map(esc).join(','));
    const csv = lines.join("\r\n");
    const bomCsv = "\ufeff" + csv;
    const buf = Buffer.from(bomCsv, "utf8");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="order-export-${new Date().toISOString().slice(0,10)}.csv"`);
    res.setHeader("Content-Length", String(buf.length));
    res.end(buf);
    return;
  }

  // 兼容 PHP: /adminapi/order/order/orderExport
  @Get("order/orderExport")
  @Authorities("order")
  @ApiOperation({ summary: "订单导出（admin 兼容 - PHP 路径别名）" })
  async orderExportAlias(@Query() query: any, @Req() req: any, @Res() res: Response) {
    return this.orderExport(query, req, res);
  }

  @Post("batch")
  @Authorities("order")
  @ApiOperation({ summary: "批量操作（占位）" })
  async batch(@Body() body: any, @Req() req: any) {
    const type = body.type ?? body.act ?? "";
    let ids: number[] = [];
    const raw = body.ids ?? body.orderIds;
    if (Array.isArray(raw)) ids = raw.map((x) => Number(x)).filter((n) => Number.isFinite(n));
    else if (typeof raw === "string") ids = raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
    else if (typeof raw === "number") ids = [raw];
    const data = body.data ?? body.patch ?? body;
    const result = await this.svc.batchOperation(String(type), ids, data, req?.user?.username);
    return { code: 0, message: "success", data: result };
  }

  // 兼容 PHP: /adminapi/order/order/batch
  @Post("order/batch")
  @Authorities("order")
  @ApiOperation({ summary: "批量操作（admin 兼容 - PHP 路径别名）" })
  async batchAlias(@Body() body: any, @Req() req: any) { return this.batch(body, req); }

  @Get("severalDetail")
  @Authorities("order")
  @ApiOperation({ summary: "批量详情（占位）" })
  async severalDetail(@Query("ids") idsParam: any) {
    let ids: number[] = [];
    const push = (v: any) => { const n = Number(v); if (!Number.isNaN(n) && n > 0) ids.push(n); };
    if (Array.isArray(idsParam)) idsParam.forEach(push);
    else if (typeof idsParam === "string") idsParam.split(",").forEach(push);
    const data = await this.svc.getSeveralDetail(Array.from(new Set(ids)));
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/severalDetail
  @Get("order/severalDetail")
  @Authorities("order")
  @ApiOperation({ summary: "批量详情（admin 兼容 - PHP 路径别名）" })
  async severalDetailAlias(@Query("ids") idsParam: any) { return this.severalDetail(idsParam); }

  @Get("printSeveral")
  @Authorities("order")
  @ApiOperation({ summary: "批量打印（占位）" })
  async printSeveral(@Query("ids") idsParam: any) {
    let ids: number[] = [];
    const push = (v: any) => { const n = Number(v); if (!Number.isNaN(n) && n > 0) ids.push(n); };
    if (Array.isArray(idsParam)) idsParam.forEach(push);
    else if (typeof idsParam === "string") idsParam.split(",").forEach(push);
    ids = Array.from(new Set(ids));
    const data = await Promise.all(ids.map((id) => this.svc.getOrderPrintData(id)));
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/printSeveral
  @Get("order/printSeveral")
  @Authorities("order")
  @ApiOperation({ summary: "批量打印（admin 兼容 - PHP 路径别名）" })
  async printSeveralAlias(@Query("ids") idsParam: any) { return this.printSeveral(idsParam); }

  @Get("shippingInfo")
  @Authorities("order")
  @ApiOperation({ summary: "物流信息（占位）" })
  async shippingInfo(@Query("id") id: string) {
    const data = await this.svc.shippingInfo(Number(id));
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/shippingInfo
  @Get("order/shippingInfo")
  @Authorities("order")
  @ApiOperation({ summary: "物流信息（admin 兼容 - PHP 路径别名）" })
  async shippingInfoAlias(@Query("id") id: string) { return this.shippingInfo(id); }

  @Get("getOrderPageConfig")
  @Authorities("order")
  @ApiOperation({ summary: "订单列表配置（占位）" })
  async getOrderPageConfig() {
    const data = await this.svc.getOrderPageConfig();
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/getOrderPageConfig
  @Get("order/getOrderPageConfig")
  @Authorities("order")
  @ApiOperation({ summary: "订单列表配置（admin 兼容 - PHP 路径别名）" })
  async getOrderPageConfigAlias() { return this.getOrderPageConfig(); }
}
