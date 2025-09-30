// @ts-nocheck
import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销员(兼容)")
@Controller("adminapi/salesman/salesman")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) { const n = Number(v); return Number.isFinite(n) ? n : dft; }

  @Get("list")
  @ApiOperation({ summary: "分销员列表（兼容）" })
  @Authorities("salesmanManage")
  async list(@Req() req: any, @Query() query: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const groupId = this.coerceNumber(query.groupId, 0);
    const where: any = { shop_id: shopId };
    if (groupId) where.group_id = groupId;
    const [records, total] = await Promise.all([
      this.prisma.salesman.findMany({ where, orderBy: { salesman_id: "desc" }, skip, take: size }),
      this.prisma.salesman.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "分销员详情（兼容）" })
  @Authorities("salesmanManage")
  async detail(@Query("id") id: number) {
    const record = await this.prisma.salesman.findUnique({ where: { salesman_id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: record };
  }

  @Post("update")
  @ApiOperation({ summary: "分销员更新（兼容）" })
  @Authorities("salesmanManage")
  async update(@Body() body: any) {
    const id = this.coerceNumber(body.salesmanId || body.id, 0);
    const data: any = {
      level: body.level !== undefined ? this.coerceNumber(body.level, 1) : undefined,
      group_id: body.groupId !== undefined ? this.coerceNumber(body.groupId, 0) : undefined,
      pid: body.pid !== undefined ? this.coerceNumber(body.pid, 0) : undefined,
    };
    await this.prisma.salesman.update({ where: { salesman_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("updateField")
  @ApiOperation({ summary: "分销员单字段更新（兼容）" })
  @Authorities("salesmanManage")
  async updateField(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const field = String(body.field || "");
    const val = body.value ?? body.val;
    const map: Record<string, string> = { level: "level", groupId: "group_id", pid: "pid" };
    const dbField = map[field] || field;
    await this.prisma.salesman.update({ where: { salesman_id: id }, data: { [dbField]: this.coerceNumber(val, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "分销员删除（兼容）" })
  @Authorities("salesmanManage")
  async del(@Body("id") id: number) {
    await this.prisma.salesman.delete({ where: { salesman_id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "分销员批量（兼容）" })
  @Authorities("salesmanManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.coerceNumber(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (["del", "delete"].includes(type)) {
      await this.prisma.salesman.deleteMany({ where: { salesman_id: { in: ids } } });
      return { code: 0, message: "批量删除成功", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Get("ranking")
  @ApiOperation({ summary: "分销员排行榜（兼容）" })
  @Authorities("salesmanManage")
  async ranking(@Req() req: any, @Query() query: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    // 简化：按 salesman.sale_amount 排序
    const [records, total] = await Promise.all([
      this.prisma.salesman.findMany({ where: { shop_id: shopId }, orderBy: { sale_amount: "desc" }, skip, take: size }),
      this.prisma.salesman.count({ where: { shop_id: shopId } }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("statisticalDetails")
  @ApiOperation({ summary: "分销员统计明细（兼容）" })
  @Authorities("salesmanManage")
  async statisticalDetails(@Query() query: any) {
    // 占位返回空数据结构
    return { code: 0, message: "success", data: { records: [], total: 0 } };
  }

  @Get("commissionDetails")
  @ApiOperation({ summary: "分销员佣金明细（兼容）" })
  @Authorities("salesmanManage")
  async commissionDetails(@Query() query: any) {
    // 占位返回空数据结构
    return { code: 0, message: "success", data: { records: [], total: 0 } };
  }

  @Get("salesmanList")
  @ApiOperation({ summary: "全部分销员下拉（兼容）" })
  @Authorities("salesmanManage")
  async salesmanList(@Req() req: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const rows = await this.prisma.salesman.findMany({ where: { shop_id: shopId }, select: { salesman_id: true, user_id: true } });
    return { code: 0, message: "success", data: rows };
  }

  @Get("customerList")
  @ApiOperation({ summary: "全部客户下拉（兼容）" })
  @Authorities("salesmanManage")
  async customerList() {
    const rows = await this.prisma.salesman_customer.findMany({ select: { salesman_customer_id: true, user_id: true } });
    return { code: 0, message: "success", data: rows };
  }
}
