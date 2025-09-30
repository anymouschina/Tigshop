// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { UserInvoiceService } from "./user-invoice/user-invoice.service";

@ApiTags("Admin API - 财务/用户发票资质 兼容")
@Controller("adminapi/finance/userInvoice")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminUserInvoiceCompatController {
  constructor(private readonly service: UserInvoiceService) {}

  // GET /adminapi/finance/userInvoice/list
  @Get("list")
  @Authorities("userInvoiceManage")
  @ApiOperation({ summary: "用户发票资质列表（admin 兼容）" })
  async list(@Query() q: any) {
    const result = await this.service.findAll({
      keyword: q.keyword ?? "",
      page: Number(q.page || 1),
      size: Number(q.size || 15),
      status: q.status !== undefined ? Number(q.status) : undefined,
      sortField: q.sort_field ?? q.sortField ?? "invoice_id",
      sortOrder: q.sort_order ?? q.sortOrder ?? "desc",
      userId: q.user_id ? Number(q.user_id) : undefined,
    });
    return { code: 0, message: "success", data: { records: result.records, total: result.total, page: result.page, size: result.size, totalPages: result.totalPages } };
  }

  // GET /adminapi/finance/userInvoice/config
  @Get("config")
  @Authorities("userInvoiceManage")
  @ApiOperation({ summary: "用户发票资质配置（admin 兼容）" })
  async config() {
    const cfg = await this.service.getConfig();
    return { code: 0, message: "success", data: { status_config: cfg.statusConfig, title_type_config: cfg.titleTypeConfig } };
  }

  // GET /adminapi/finance/userInvoice/detail?id=
  @Get("detail")
  @Authorities("userInvoiceManage")
  @ApiOperation({ summary: "用户发票资质详情（admin 兼容）" })
  async detail(@Query("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    const item = await this.service.findById(num);
    return { code: 0, message: "success", data: item };
  }

  // POST /adminapi/finance/userInvoice/update
  @Post("update")
  @Authorities("userInvoiceUpdateManage")
  @ApiOperation({ summary: "更新用户发票资质（admin 兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.id);
    if (!id) return { code: 1, message: "缺少 id", data: null };
    const updated = await this.service.update(id, {
      status: body.status !== undefined ? Number(body.status) : undefined,
      applyReply: body.apply_reply ?? body.applyReply,
      titleType: body.title_type ?? body.titleType,
      title: body.title,
      taxNumber: body.tax_number ?? body.taxNumber,
      registerAddress: body.register_address ?? body.registerAddress,
      registerPhone: body.register_phone ?? body.registerPhone,
      bankName: body.bank_name ?? body.bankName,
      bankAccount: body.bank_account ?? body.bankAccount,
      applyRemark: body.apply_remark ?? body.applyRemark,
    });
    return { code: 0, message: "success", data: updated };
  }

  // POST /adminapi/finance/userInvoice/del
  @Post("del")
  @Authorities("userInvoiceDelManage")
  @ApiOperation({ summary: "删除用户发票资质（admin 兼容）" })
  async del(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    await this.service.delete(num);
    return { code: 0, message: "success", data: true };
  }

  // POST /adminapi/finance/userInvoice/batch { type: 'del', ids: number[] }
  @Post("batch")
  @Authorities("userInvoiceBatchManage")
  @ApiOperation({ summary: "用户发票资质批量操作（admin 兼容）" })
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map(Number) : [];
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (body.type === "del") {
      await this.service.batchDelete(ids);
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }
}
