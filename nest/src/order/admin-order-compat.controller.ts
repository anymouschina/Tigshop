// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards, Req, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { AdminOrderCompatService } from "./admin-order-compat.service";

@ApiTags("Admin API - 订单(兼容路径)")
@Controller("adminapi/order")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminOrderCompatController {
  constructor(private readonly svc: AdminOrderCompatService) {}

  @Get("list")
  @Authorities("order")
  @ApiOperation({ summary: "订单列表（admin 兼容）" })
  async list(@Query() query: any) {
    const data = await this.svc.list(query);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: /adminapi/order/order/list
  @Get("order/list")
  @Authorities("order")
  @ApiOperation({ summary: "订单列表（admin 兼容 - PHP 路径别名）" })
  async listAlias(@Query() query: any) {
    return this.list(query);
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
  async aftersalesList(@Query() _query: any) {
    return { code: 0, message: "success", data: { records: [], total: 0, size: Number(_query.size)||15, current: Number(_query.page)||1, pages: 1 } };
  }

  @Get("aftersales/applyType")
  @Authorities("order")
  @ApiOperation({ summary: "售后申请类型（占位）" })
  async aftersalesApplyType() {
    return { code: 0, message: "success", data: {} };
  }

  @Get("aftersales/returnGoodsStatus")
  @Authorities("order")
  @ApiOperation({ summary: "售后退换货状态（占位）" })
  async aftersalesReturnGoodsStatus() {
    return { code: 0, message: "success", data: {} };
  }

  @Get("aftersales/detail")
  @Authorities("order")
  @ApiOperation({ summary: "售后详情（占位）" })
  async aftersalesDetail(@Query("id") _id: string) {
    return { code: 0, message: "success", data: null };
  }

  @Post("aftersales/update")
  @Authorities("order")
  @ApiOperation({ summary: "售后更新（占位）" })
  async aftersalesUpdate() { return { code: 0, message: "success" }; }

  @Post("aftersales/receive")
  @Authorities("order")
  @ApiOperation({ summary: "售后确认收货（占位）" })
  async aftersalesReceive() { return { code: 0, message: "success" }; }

  @Post("aftersales/record")
  @Authorities("order")
  @ApiOperation({ summary: "售后反馈记录（占位）" })
  async aftersalesRecord() { return { code: 0, message: "success" }; }

  @Post("aftersales/complete")
  @Authorities("order")
  @ApiOperation({ summary: "售后完结（占位）" })
  async aftersalesComplete() { return { code: 0, message: "success" }; }

  // -------- 订单管理常用操作（占位） --------
  @Get("orderWayBill")
  @Authorities("order")
  @ApiOperation({ summary: "获取电子面单（占位）" })
  async orderWayBill() { return { code: 0, message: "success", data: null }; }

  // 兼容 PHP: /adminapi/order/order/orderWayBill
  @Get("order/orderWayBill")
  @Authorities("order")
  @ApiOperation({ summary: "获取电子面单（admin 兼容 - PHP 路径别名）" })
  async orderWayBillAlias() { return this.orderWayBill(); }

  @Get("parentDetail")
  @Authorities("order")
  @ApiOperation({ summary: "父订单详情（占位）" })
  async parentDetail(@Query("id") _id: string) { return { code: 0, message: "success", data: null }; }

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
  @ApiOperation({ summary: "订单拆分（占位）" })
  async splitStoreOrder() { return { code: 0, message: "success" }; }

  // 兼容 PHP: /adminapi/order/order/splitStoreOrder
  @Post("order/splitStoreOrder")
  @Authorities("order")
  @ApiOperation({ summary: "订单拆分（admin 兼容 - PHP 路径别名）" })
  async splitStoreOrderAlias() { return this.splitStoreOrder(); }

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
  async modifyProduct() { return { code: 0, message: "success" }; }

  // 兼容 PHP: /adminapi/order/order/modifyProduct
  @Post("order/modifyProduct")
  @Authorities("order")
  @ApiOperation({ summary: "修改商品信息（admin 兼容 - PHP 路径别名）" })
  async modifyProductAlias() { return this.modifyProduct(); }

  @Post("getAddProductInfo")
  @Authorities("order")
  @ApiOperation({ summary: "添加商品前置信息（占位）" })
  async getAddProductInfo() { return { code: 0, message: "success", data: null }; }

  // 兼容 PHP: /adminapi/order/order/getAddProductInfo
  @Post("order/getAddProductInfo")
  @Authorities("order")
  @ApiOperation({ summary: "添加商品前置信息（admin 兼容 - PHP 路径别名）" })
  async getAddProductInfoAlias() { return this.getAddProductInfo(); }

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
  async orderPrint() { return { code: 0, message: "success", data: null }; }

  // 兼容 PHP: /adminapi/order/order/orderPrint
  @Get("order/orderPrint")
  @Authorities("order")
  @ApiOperation({ summary: "打印订单（admin 兼容 - PHP 路径别名）" })
  async orderPrintAlias() { return this.orderPrint(); }

  @Get("orderPrintBill")
  @Authorities("order")
  @ApiOperation({ summary: "打印电子面单（占位）" })
  async orderPrintBill() { return { code: 0, message: "success", data: null }; }

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
  async batch() { return { code: 0, message: "success" }; }

  // 兼容 PHP: /adminapi/order/order/batch
  @Post("order/batch")
  @Authorities("order")
  @ApiOperation({ summary: "批量操作（admin 兼容 - PHP 路径别名）" })
  async batchAlias() { return this.batch(); }

  @Get("severalDetail")
  @Authorities("order")
  @ApiOperation({ summary: "批量详情（占位）" })
  async severalDetail() { return { code: 0, message: "success", data: null }; }

  // 兼容 PHP: /adminapi/order/order/severalDetail
  @Get("order/severalDetail")
  @Authorities("order")
  @ApiOperation({ summary: "批量详情（admin 兼容 - PHP 路径别名）" })
  async severalDetailAlias() { return this.severalDetail(); }

  @Get("printSeveral")
  @Authorities("order")
  @ApiOperation({ summary: "批量打印（占位）" })
  async printSeveral() { return { code: 0, message: "success", data: null }; }

  // 兼容 PHP: /adminapi/order/order/printSeveral
  @Get("order/printSeveral")
  @Authorities("order")
  @ApiOperation({ summary: "批量打印（admin 兼容 - PHP 路径别名）" })
  async printSeveralAlias() { return this.printSeveral(); }

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
  async getOrderPageConfig() { return { code: 0, message: "success", data: {} }; }

  // 兼容 PHP: /adminapi/order/order/getOrderPageConfig
  @Get("order/getOrderPageConfig")
  @Authorities("order")
  @ApiOperation({ summary: "订单列表配置（admin 兼容 - PHP 路径别名）" })
  async getOrderPageConfigAlias() { return this.getOrderPageConfig(); }
}
