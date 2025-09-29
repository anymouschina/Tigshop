// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards, Req } from "@nestjs/common";
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

  @Get("detail")
  @Authorities("order")
  @ApiOperation({ summary: "订单详情（admin 兼容）" })
  async detail(@Query("id") id: string) {
    const data = await this.svc.detail(Number(id));
    return { code: 0, message: "success", data };
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
}
