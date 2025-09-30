// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { RefundLogService } from "./refund-log/refund-log.service";

@ApiTags("Admin API - 财务/退款记录 兼容")
@Controller("adminapi/finance/refundLog")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminRefundLogCompatController {
  constructor(private readonly service: RefundLogService) {}

  // GET /adminapi/finance/refundLog/list
  @Get("list")
  @Authorities("refundLogManage")
  @ApiOperation({ summary: "退款记录列表（admin 兼容）" })
  async list(@Query() q: any) {
    const result = await this.service.findAll({
      keyword: q.keyword ?? "",
      order_id: q.order_id ? Number(q.order_id) : 0,
      user_id: q.user_id ? Number(q.user_id) : 0,
      refund_apply_id: q.refund_apply_id ? Number(q.refund_apply_id) : 0,
      refund_type: q.refund_type !== undefined ? Number(q.refund_type) : -1,
      status: q.status !== undefined ? Number(q.status) : -1,
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
}
