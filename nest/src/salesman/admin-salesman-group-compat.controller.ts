// @ts-nocheck
import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销小组(兼容)")
@Controller("adminapi/salesman/group")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanGroupCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "分销组列表（兼容）" })
  @Authorities("salesmanGroupManage")
  async list(@Req() req: any, @Query() query: any) {
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const keyword = (query.groupName || "").trim();
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const where: any = { shop_id: shopId };
    if (keyword) where.group_name = { contains: keyword };
    const [records, total] = await Promise.all([
      this.prisma.salesman_group.findMany({ where, orderBy: { group_id: "desc" }, skip, take: size }),
      this.prisma.salesman_group.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "分销组详情（兼容）" })
  @Authorities("salesmanGroupManage")
  async detail(@Query("id") id: number) {
    const record = await this.prisma.salesman_group.findUnique({ where: { group_id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: record };
  }

  @Post("create")
  @ApiOperation({ summary: "分销组创建（兼容）" })
  @Authorities("salesmanGroupManage")
  async create(@Req() req: any, @Body() body: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const now = Math.floor(Date.now() / 1000);
    await this.prisma.salesman_group.create({
      data: {
        group_name: body.groupName ?? "",
        describe: body.describe ?? "",
        add_time: now,
        shop_id: shopId,
      },
    });
    return { code: 0, message: "success", data: true };
  }

  @Post("update")
  @ApiOperation({ summary: "分销组更新（兼容）" })
  @Authorities("salesmanGroupManage")
  async update(@Body() body: any) {
    const id = this.coerceNumber(body.groupId || body.id, 0);
    await this.prisma.salesman_group.update({
      where: { group_id: id },
      data: { group_name: body.groupName ?? undefined, describe: body.describe ?? undefined },
    });
    return { code: 0, message: "success", data: true };
  }

  @Post("updateField")
  @ApiOperation({ summary: "分销组单字段更新（兼容）" })
  @Authorities("salesmanGroupManage")
  async updateField(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const field = String(body.field || "");
    const val = body.value ?? body.val;
    const map: Record<string, string> = { groupName: "group_name", describe: "describe" };
    const dbField = map[field] || field;
    await this.prisma.salesman_group.update({ where: { group_id: id }, data: { [dbField]: val } });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "分销组删除（兼容）" })
  @Authorities("salesmanGroupManage")
  async del(@Body("id") id: number) {
    await this.prisma.salesman_group.delete({ where: { group_id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "分销组批量（兼容）" })
  @Authorities("salesmanGroupManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.coerceNumber(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (["del", "delete"].includes(type)) {
      await this.prisma.salesman_group.deleteMany({ where: { group_id: { in: ids } } });
      return { code: 0, message: "批量删除成功", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Get("config")
  @ApiOperation({ summary: "分销组配置（兼容）" })
  @Authorities("salesmanGroupManage")
  async config() {
    return { code: 0, message: "success", data: {} };
  }
}
