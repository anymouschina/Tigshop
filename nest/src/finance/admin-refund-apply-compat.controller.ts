// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { RefundApplyService } from "./refund-apply/refund-apply.service";
import { REFUND_APPLY_STATUS } from "./refund-apply/refund-apply.dto";

@ApiTags("Admin API - 财务/退款申请 兼容")
@Controller("adminapi/finance/refundApply")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminRefundApplyCompatController {
  constructor(private readonly refundApplyService: RefundApplyService) {}

  // GET /adminapi/finance/refundApply/list
  @Get("list")
  @Authorities("refundApplyManage")
  @ApiOperation({ summary: "退款申请列表（admin 兼容）" })
  async list(@Query() query: any) {
    const result = await this.refundApplyService.findAll({
      keyword: query.keyword ?? "",
      user_id: Number(query.user_id ?? query.userId ?? 0),
      order_id: Number(query.order_id ?? query.orderId ?? 0),
      status: Number(query.status ?? -1),
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      sort_field: query.sort_field ?? query.sortField ?? "id",
      sort_order: query.sort_order ?? query.sortOrder ?? "desc",
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

  // GET /adminapi/finance/refundApply/detail?id=
  @Get("detail")
  @Authorities("refundApplyManage")
  @ApiOperation({ summary: "退款申请详情（admin 兼容）" })
  async detail(@Query("id") id: number) {
    const item = await this.refundApplyService.findOne(Number(id));
    return { code: 0, message: "success", data: item };
  }

  // GET /adminapi/finance/refundApply/config
  @Get("config")
  @Authorities("refundApplyManage")
  @ApiOperation({ summary: "退款申请配置（admin 兼容）" })
  async config() {
    return { code: 0, message: "success", data: REFUND_APPLY_STATUS };
  }

  // POST /adminapi/finance/refundApply/audit
  @Post("audit")
  @Authorities("refundApplyUpdateManage")
  @ApiOperation({ summary: "审核退款申请（admin 兼容）" })
  async audit(@Body() body: any) {
    // body: { id, status, admin_remark }
    const id = Number(body.id);
    const status = Number(body.status);
    const admin_remark = body.admin_remark ?? body.adminRemark ?? "";
    await this.refundApplyService.update({ id, status, admin_remark });
    return { code: 0, message: "success" };
  }

  // POST /adminapi/finance/refundApply/offlineAudit
  @Post("offlineAudit")
  @Authorities("refundApplyUpdateManage")
  @ApiOperation({ summary: "确认线下转账（admin 兼容）" })
  async offlineAudit(@Body() body: any) {
    // 与 audit 一致，额外可记录 offline 字段；当前复用 update 流程
    const id = Number(body.id);
    const admin_remark = body.admin_remark ?? body.adminRemark ?? "";
    // 线下审核视为已退款完成或审核通过，按 PHP 行为通常置为通过；此处置为通过(1)，如需区分可后续扩展
    const status = Number(body.status ?? 1);
    await this.refundApplyService.update({ id, status, admin_remark });
    return { code: 0, message: "success" };
  }
}
