// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { UserBalanceLogService } from "./user-balance-log/user-balance-log.service";

@ApiTags("Admin API - 财务/余额日志 兼容")
@Controller("adminapi/finance/userBalanceLog")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminUserBalanceLogCompatController {
  constructor(private readonly service: UserBalanceLogService) {}

  // GET /adminapi/finance/userBalanceLog/list
  @Get("list")
  @Authorities("userBalanceLogManage")
  @ApiOperation({ summary: "余额日志列表（admin 兼容）" })
  async list(@Query() q: any) {
    const result = await this.service.findAll({
      keyword: q.keyword ?? "",
      user_id: Number(q.user_id ?? q.userId ?? 0),
      order_id: Number(q.order_id ?? q.orderId ?? 0),
      type: Number(q.type ?? -1),
      change_type: Number(q.change_type ?? q.changeType ?? -1),
      start_date: q.start_date ?? q.startDate,
      end_date: q.end_date ?? q.endDate,
      page: Number(q.page || 1),
      size: Number(q.size || 15),
      sort_field: q.sort_field ?? q.sortField ?? "id",
      sort_order: q.sort_order ?? q.sortOrder ?? "desc",
    });
    return {
      code: 0,
      message: "success",
      data: {
        records: result.items,
        total: result.total,
        page: result.page,
        size: result.size,
        total_pages: result.total_pages,
      },
    };
  }

  // POST /adminapi/finance/userBalanceLog/del
  @Post("del")
  @Authorities("userBalanceLogDelManage")
  @ApiOperation({ summary: "删除余额日志（admin 兼容）" })
  async del(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    await this.service.remove(num);
    return { code: 0, message: "success", data: true };
  }

  // POST /adminapi/finance/userBalanceLog/batch  { type: 'del', ids: number[] }
  @Post("batch")
  @Authorities("userBalanceLogBatchManage")
  @ApiOperation({ summary: "余额日志批量操作（admin 兼容）" })
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map(Number) : [];
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (body.type === "del") {
      await this.service.batchRemove(ids);
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }
}
