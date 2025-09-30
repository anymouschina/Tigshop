// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - PC导航(兼容)")
@Controller("adminapi/decorate/pcNavigation")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminPcNavigationCompatController {
  constructor(private prisma: PrismaService) {}

  private num(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "导航列表（兼容）" })
  @Authorities("pcNavigationManage")
  async list(@Query() q: any) {
    const page = Math.max(1, this.num(q.page, 1));
    const size = Math.max(1, this.num(q.size, 15));
    const skip = (page - 1) * size;
    const keyword = (q.keyword || "").trim();
    const type = this.num(q.type, 0);
    const parent_id = this.num(q.parent_id, 0);
    const is_show = this.num(q.is_show, -1);

    const where: any = {};
    if (keyword) where.title = { contains: keyword };
    if (type > 0) where.type = type;
    if (parent_id >= 0) where.parent_id = parent_id;
    if (is_show > -1) where.is_show = !!is_show;

    const [records, total] = await Promise.all([
      this.prisma.pc_navigation.findMany({ where, orderBy: { id: "desc" }, skip, take: size }),
      this.prisma.pc_navigation.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "导航详情（兼容）" })
  @Authorities("pcNavigationManage")
  async detail(@Query("id") id: number) {
    const item = await this.prisma.pc_navigation.findUnique({ where: { id: this.num(id, 0) } });
    return { code: 0, message: "success", data: item };
  }

  @Get("getParentNav")
  @ApiOperation({ summary: "上级导航（兼容）" })
  @Authorities("pcNavigationManage")
  async getParentNav(@Query("type") type: number) {
    const t = this.num(type, 0);
    const list = await this.prisma.pc_navigation.findMany({ where: { parent_id: 0, ...(t ? { type: t } : {}) }, orderBy: { id: "desc" } });
    return { code: 0, message: "success", data: list };
  }

  @Get("selectLink")
  @ApiOperation({ summary: "可选链接（兼容-简化）" })
  @Authorities("pcNavigationManage")
  async selectLink() {
    const base = [
      { name: "首页", link: "/" },
      { name: "商品分类", link: "/category" },
      { name: "购物车", link: "/cart" },
      { name: "个人中心", link: "/user" },
    ];
    return { code: 0, message: "success", data: base };
  }

  @Post("create")
  @ApiOperation({ summary: "新增导航（兼容）" })
  @Authorities("pcNavigationManage")
  async create(@Body() body: any) {
    const data: any = {
      title: body.title || "",
      is_show: !!(body.is_show ?? 1),
      is_blank: !!(body.is_blank ?? 0),
      link: JSON.stringify(body.link || {}),
      type: this.num(body.type, 0),
      parent_id: this.num(body.parent_id, 0),
      icon: body.icon || "",
      // sort_order 字段在 schema 为 Boolean，做兼容处理
      sort_order: !!this.num(body.sort_order ?? 50, 0),
    };
    const created = await this.prisma.pc_navigation.create({ data });
    return { code: 0, message: "success", data: created };
  }

  @Post("update")
  @ApiOperation({ summary: "更新导航（兼容）" })
  @Authorities("pcNavigationManage")
  async update(@Body() body: any) {
    const id = this.num(body.id, 0);
    const data: any = {};
    if (body.title != null) data.title = body.title;
    if (body.is_show != null) data.is_show = !!body.is_show;
    if (body.is_blank != null) data.is_blank = !!body.is_blank;
    if (body.link != null) data.link = JSON.stringify(body.link || {});
    if (body.type != null) data.type = this.num(body.type, 0);
    if (body.parent_id != null) data.parent_id = this.num(body.parent_id, 0);
    if (body.icon != null) data.icon = body.icon;
    if (body.sort_order != null) data.sort_order = !!this.num(body.sort_order, 0);
    const updated = await this.prisma.pc_navigation.update({ where: { id }, data });
    return { code: 0, message: "success", data: updated };
  }

  @Post("updateField")
  @ApiOperation({ summary: "更新单字段（兼容）" })
  @Authorities("pcNavigationManage")
  async updateField(@Body() body: any) {
    const id = this.num(body.id, 0);
    const field = String(body.field || "");
    const val = body.val;
    const allow = ["sort_order", "is_show", "is_blank"];
    if (!id || allow.indexOf(field) === -1) return { code: 1, message: "#field 错误", data: null };
    const data: any = {};
    if (field === "sort_order") data.sort_order = !!this.num(val, 0);
    if (field === "is_show") data.is_show = !!val;
    if (field === "is_blank") data.is_blank = !!val;
    await this.prisma.pc_navigation.update({ where: { id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "删除（兼容）" })
  @Authorities("pcNavigationManage")
  async del(@Body("id") id: number) {
    await this.prisma.pc_navigation.delete({ where: { id: this.num(id, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "批量（兼容，仅del）" })
  @Authorities("pcNavigationManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.num(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (type === "del" || type === "delete") {
      await this.prisma.pc_navigation.deleteMany({ where: { id: { in: ids } } });
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }
}
