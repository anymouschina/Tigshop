// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { OrderInvoiceService } from "./order-invoice/order-invoice.service";

@ApiTags("Admin API - 财务/发票申请 兼容")
@Controller("adminapi/finance/orderInvoice")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminOrderInvoiceCompatController {
  constructor(private readonly service: OrderInvoiceService) {}

  // GET /adminapi/finance/orderInvoice/list
  @Get("list")
  @Authorities("orderInvoiceManage")
  @ApiOperation({ summary: "发票申请列表（admin 兼容）" })
  async list(@Query() q: any) {
    const filter = {
      keyword: q.keyword || "",
      invoice_type: Number(q.invoice_type ?? q.invoiceType ?? 0) || 0,
      status: Number(q.status ?? -1),
      shop_type: Number(q.shop_type ?? q.shopType ?? 0) || 0,
      shop_id: Number(q.shop_id ?? q.shopId ?? -1),
      page: Number(q.page || 1),
      size: Number(q.size || 15),
      sort_field: q.sort_field ?? q.sortField ?? "id",
      sort_order: q.sort_order ?? q.sortOrder ?? "desc",
    };
    const records = await this.service.getFilterResult(filter);
    const total = await this.service.getFilterCount(filter);
    return { code: 0, message: "success", data: { records, total } };
  }

  // GET /adminapi/finance/orderInvoice/detail?id=
  @Get("detail")
  @Authorities("orderInvoiceManage")
  @ApiOperation({ summary: "发票申请详情（admin 兼容）" })
  async detail(@Query("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    const item = await this.service.getDetail(num);
    return { code: 0, message: "success", data: item };
  }

  // POST /adminapi/finance/orderInvoice/update
  @Post("update")
  @Authorities("orderInvoiceUpdateManage")
  @ApiOperation({ summary: "更新发票申请（admin 兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.id);
    if (!id) return { code: 1, message: "缺少 id", data: null };
    const ret = await this.service.updateOrderInvoice(id, {
      id,
      status: Number(body.status),
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      apply_reply: body.apply_reply ?? body.applyReply,
      invoice_attachment: body.invoice_attachment ?? body.invoiceAttachment,
    });
    return { code: 0, message: "success", data: ret };
  }

  // POST /adminapi/finance/orderInvoice/del
  @Post("del")
  @Authorities("orderInvoiceDelManage")
  @ApiOperation({ summary: "删除发票申请（admin 兼容）" })
  async del(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    await this.service.deleteOrderInvoice(num);
    return { code: 0, message: "success", data: true };
  }

  // POST /adminapi/finance/orderInvoice/batch  { type: 'del', ids: number[] }
  @Post("batch")
  @Authorities("orderInvoiceBatchManage")
  @ApiOperation({ summary: "发票申请批量操作（admin 兼容）" })
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map(Number) : [];
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (body.type === "del") {
      await this.service.batchDeleteOrderInvoice(ids);
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }
}
