// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销素材管理(兼容)")
@Controller("adminapi/salesman/material")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanMaterialCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "素材列表（兼容）" })
  @Authorities("materialManage")
  async list(@Query() query: any, @Query("userId") _userId: number | undefined, @Request() req: any) {
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const categoryId = this.coerceNumber(query.categoryId, 0);
    const keyword = (query.title || query.keyword || "").trim();
    const shopId = await this.panel.getUserShopId(req?.user?.userId);
    const where: any = { shop_id: shopId };
    if (categoryId) where.category_id = categoryId;
    if (keyword) where.title = { contains: keyword };
    const [records, total] = await Promise.all([
      this.prisma.salesman_material.findMany({ where, orderBy: { material_id: "desc" }, skip, take: size }),
      this.prisma.salesman_material.count({ where }),
    ]);
    // Attach category name when available
    const catIds = Array.from(new Set(records.map((r) => r.category_id).filter(Boolean)));
    let catMap: Record<number, string> = {};
    if (catIds.length) {
      const cats = await this.prisma.salesman_material_category.findMany({ where: { category_id: { in: catIds } } });
      catMap = Object.fromEntries(cats.map((c) => [c.category_id, c.category_name]));
    }
    const out = records.map((r) => ({ ...r, category_name: r.category_id ? catMap[r.category_id] || "" : "" }));
    return { code: 0, message: "success", data: { records: out, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "素材详情（兼容）" })
  @Authorities("materialManage")
  async detail(@Query("id") id: number) {
    const record = await this.prisma.salesman_material.findUnique({ where: { material_id: this.coerceNumber(id, 0) } });
    if (record && record.content && typeof record.content === "string") {
      // content may be long text/html; return as-is
    }
    return { code: 0, message: "success", data: record };
  }

  @Post("create")
  @ApiOperation({ summary: "素材创建（兼容）" })
  @Authorities("materialManage")
  async create(@Body() body: any, @Request() req: any) {
    const shopId = await this.panel.getUserShopId(req?.user?.userId);
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      shop_id: shopId,
      title: body.title ?? "",
      cover: body.cover ?? "",
      category_id: this.coerceNumber(body.categoryId, 0) || null,
      content: body.content ?? "",
      view_num: this.coerceNumber(body.viewNum, 0),
      share_num: this.coerceNumber(body.shareNum, 0),
      like_num: this.coerceNumber(body.likeNum, 0),
      sort_order: this.coerceNumber(body.sortOrder ?? 50, 50),
      is_show: this.coerceNumber(body.isShow ?? 1, 1),
      add_time: now,
      update_time: now,
    };
    await this.prisma.salesman_material.create({ data });
    return { code: 0, message: "success", data: true };
  }

  @Post("update")
  @ApiOperation({ summary: "素材更新（兼容）" })
  @Authorities("materialManage")
  async update(@Body() body: any) {
    const id = this.coerceNumber(body.materialId || body.id, 0);
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      title: body.title ?? undefined,
      cover: body.cover ?? undefined,
      category_id: body.categoryId !== undefined ? (this.coerceNumber(body.categoryId, 0) || null) : undefined,
      content: body.content ?? undefined,
      view_num: body.viewNum !== undefined ? this.coerceNumber(body.viewNum, 0) : undefined,
      share_num: body.shareNum !== undefined ? this.coerceNumber(body.shareNum, 0) : undefined,
      like_num: body.likeNum !== undefined ? this.coerceNumber(body.likeNum, 0) : undefined,
      sort_order: body.sortOrder !== undefined ? this.coerceNumber(body.sortOrder ?? 50, 50) : undefined,
      is_show: body.isShow !== undefined ? this.coerceNumber(body.isShow ?? 1, 1) : undefined,
      update_time: now,
    };
    await this.prisma.salesman_material.update({ where: { material_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("updateField")
  @ApiOperation({ summary: "素材更新单字段（兼容）" })
  @Authorities("materialManage")
  async updateField(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const field = body.field;
    const value = body.value;
    const now = Math.floor(Date.now() / 1000);
    const data: any = { update_time: now };
    const map: Record<string, string> = {
      title: "title",
      cover: "cover",
      categoryId: "category_id",
      content: "content",
      viewNum: "view_num",
      shareNum: "share_num",
      likeNum: "like_num",
      sortOrder: "sort_order",
      isShow: "is_show",
    };
    const dbField = map[field] || field;
    data[dbField] = ["view_num", "share_num", "like_num", "sort_order", "is_show", "category_id"].includes(dbField)
      ? this.coerceNumber(value, 0)
      : value;
    await this.prisma.salesman_material.update({ where: { material_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "素材删除（兼容）" })
  @Authorities("materialManage")
  async del(@Body("id") id: number) {
    await this.prisma.salesman_material.delete({ where: { material_id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "素材批量（兼容）" })
  @Authorities("materialManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.coerceNumber(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (["del", "delete"].includes(type)) {
      await this.prisma.salesman_material.deleteMany({ where: { material_id: { in: ids } } });
      return { code: 0, message: "批量删除成功", data: true };
    }
    if (type === "show" || type === "isShow1") {
      await this.prisma.salesman_material.updateMany({ where: { material_id: { in: ids } }, data: { is_show: 1 } });
      return { code: 0, message: "批量上架成功", data: true };
    }
    if (type === "hide" || type === "isShow0") {
      await this.prisma.salesman_material.updateMany({ where: { material_id: { in: ids } }, data: { is_show: 0 } });
      return { code: 0, message: "批量下架成功", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Get("config")
  @ApiOperation({ summary: "素材配置（兼容）" })
  @Authorities("materialManage")
  async config() {
    // Placeholder for any UI-config like max upload size, allowed types, etc.
    return { code: 0, message: "success", data: {} };
  }
}
