// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { UserRechargeOrderService } from "./user-recharge-order/user-recharge-order.service";

@ApiTags("Admin API - 财务/充值订单 兼容")
@Controller("adminapi/finance/userRechargeOrder")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminUserRechargeOrderCompatController {
  constructor(private readonly service: UserRechargeOrderService) {}

  // GET /adminapi/finance/userRechargeOrder/list
  @Get("list")
  @Authorities("userRechargeOrderManage")
  @ApiOperation({ summary: "充值订单列表（admin 兼容）" })
  async list(@Query() q: any) {
    const result = await this.service.findAll({
      keyword: q.keyword ?? "",
      page: Number(q.page || 1),
      size: Number(q.size || 15),
      status: q.status !== undefined ? Number(q.status) : undefined,
      userId: q.user_id ? Number(q.user_id) : undefined,
      paymentType: q.payment_type ?? q.paymentType,
      sortField: q.sort_field ?? q.sortField ?? "order_id",
      sortOrder: q.sort_order ?? q.sortOrder ?? "desc",
      startTime: q.start_time ?? q.startTime,
      endTime: q.end_time ?? q.endTime,
    });
    return { code: 0, message: "success", data: { records: result.records, total: result.total, page: result.page, size: result.size, totalPages: result.totalPages } };
  }

  // GET /adminapi/finance/userRechargeOrder/detail?id=
  @Get("detail")
  @Authorities("userRechargeOrderManage")
  @ApiOperation({ summary: "充值订单详情（admin 兼容）" })
  async detail(@Query("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    const item = await this.service.findById(num);
    return { code: 0, message: "success", data: item };
  }

  // POST /adminapi/finance/userRechargeOrder/create
  @Post("create")
  @Authorities("userRechargeOrderUpdateManage")
  @ApiOperation({ summary: "创建充值订单（admin 兼容）" })
  async create(@Body() body: any) {
    const created = await this.service.create({
      userId: Number(body.user_id ?? body.userId),
      amount: Number(body.amount),
      postscript: body.postscript ?? "",
      status: body.status !== undefined ? Number(body.status) : undefined,
      paymentType: body.payment_type ?? body.paymentType,
      adminId: body.admin_id ?? body.adminId,
    });
    return { code: 0, message: "success", data: created };
  }

  // POST /adminapi/finance/userRechargeOrder/update
  @Post("update")
  @Authorities("userRechargeOrderUpdateManage")
  @ApiOperation({ summary: "更新充值订单（admin 兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.id);
    if (!id) return { code: 1, message: "缺少 id", data: null };
    const updated = await this.service.update(id, {
      status: body.status !== undefined ? Number(body.status) : undefined,
      postscript: body.postscript,
      paymentType: body.payment_type ?? body.paymentType,
      paymentTime: body.payment_time ?? body.paymentTime,
      tradeNo: body.trade_no ?? body.tradeNo,
      adminRemark: body.admin_remark ?? body.adminRemark,
    });
    return { code: 0, message: "success", data: updated };
  }

  // POST /adminapi/finance/userRechargeOrder/del
  @Post("del")
  @Authorities("userRechargeOrderDelManage")
  @ApiOperation({ summary: "删除充值订单（admin 兼容）" })
  async del(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    await this.service.delete(num);
    return { code: 0, message: "success", data: true };
  }

  // POST /adminapi/finance/userRechargeOrder/batch
  @Post("batch")
  @Authorities("userRechargeOrderBatchManage")
  @ApiOperation({ summary: "充值订单批量操作（admin 兼容）" })
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map(Number) : [];
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (body.type === "del") {
      await this.service.batchDelete(ids);
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  // GET /adminapi/finance/userRechargeOrder/statistics
  @Get("statistics")
  @Authorities("userRechargeOrderManage")
  @ApiOperation({ summary: "充值统计（admin 兼容）" })
  async statistics(@Query() q: any) {
    const data = await this.service.getStatistics({
      status: q.status !== undefined ? Number(q.status) : undefined,
      userId: q.user_id ? Number(q.user_id) : undefined,
      startTime: q.start_time ?? q.startTime,
      endTime: q.end_time ?? q.endTime,
    });
    return { code: 0, message: "success", data };
  }

  // GET /adminapi/finance/userRechargeOrder/config
  @Get("config")
  @Authorities("userRechargeOrderManage")
  @ApiOperation({ summary: "充值配置（admin 兼容）" })
  async config() {
    const cfg = await this.service.getConfig();
    return { code: 0, message: "success", data: { status_config: cfg.statusConfig, payment_type_config: cfg.paymentTypeConfig, min_amount: cfg.minAmount, max_amount: cfg.maxAmount } };
  }
}
