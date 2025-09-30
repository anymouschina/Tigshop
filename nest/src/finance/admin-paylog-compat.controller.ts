// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PaylogService } from "./paylog/paylog.service";

@ApiTags("Admin API - 财务/交易日志 兼容")
@Controller("adminapi/finance/payLog")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminPayLogCompatController {
  constructor(private readonly paylogService: PaylogService) {}

  // GET /adminapi/finance/payLog/list
  @Get("list")
  @Authorities("payLogManage")
  @ApiOperation({ summary: "交易日志列表（admin 兼容）" })
  async list(@Query() query: any) {
    const filter = {
      keyword: query.keyword || "",
      pay_status: query.pay_status ?? query.payStatus ?? -1,
      order_id: Number(query.order_id ?? query.orderId ?? 0),
      payment_code: query.payment_code ?? query.paymentCode,
      start_time: query.start_time ?? query.startTime,
      end_time: query.end_time ?? query.endTime,
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      sort_field: query.sort_field ?? query.sortField ?? "paylog_id",
      sort_order: query.sort_order ?? query.sortOrder ?? "desc",
    };

    const records = await this.paylogService.getFilterResult(filter);
    const total = await this.paylogService.getFilterCount(filter);
    return { code: 0, message: "success", data: { records, total } };
  }

  // POST /adminapi/finance/payLog/del
  @Post("del")
  @Authorities("payLogDelManage")
  @ApiOperation({ summary: "删除交易日志（admin 兼容）" })
  async del(@Body("id") id: number) {
    if (!id) return { code: 1, message: "缺少 id", data: null };
    await this.paylogService.deletePaylog(Number(id));
    return { code: 0, message: "success", data: true };
  }

  // POST /adminapi/finance/payLog/batch  { type: 'del', ids: number[] }
  @Post("batch")
  @Authorities("payLogBatchManage")
  @ApiOperation({ summary: "交易日志批量操作（admin 兼容）" })
  async batch(@Body() body: any) {
    const type = body.type;
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map(Number) : [];
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (type === "del") {
      await this.paylogService.batchDeletePaylog(ids);
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }
}
