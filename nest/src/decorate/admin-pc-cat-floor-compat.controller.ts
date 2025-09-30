// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - PC楼层(兼容)")
@Controller("adminapi/decorate/pcCatFloor")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminPcCatFloorCompatController {
  constructor(private prisma: PrismaService) {}

  private num(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "楼层列表（兼容）" })
  @Authorities("pcCatFloorManage")
  async list(@Query() q: any) {
    const page = Math.max(1, this.num(q.page, 1));
    const size = Math.max(1, this.num(q.size, 15));
    const skip = (page - 1) * size;
    const keyword = (q.keyword || "").trim();
    const is_show = this.num(q.is_show, -1);
    const where: any = {};
    if (keyword) where.cat_floor_name = { contains: keyword };
    if (is_show > -1) where.is_show = this.num(q.is_show, 1);

    const [records, total] = await Promise.all([
      this.prisma.pc_cat_floor.findMany({ where, orderBy: { sort_order: "asc" }, skip, take: size }),
      this.prisma.pc_cat_floor.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "楼层详情（兼容）" })
  @Authorities("pcCatFloorManage")
  async detail(@Query("id") id: number) {
    const item = await this.prisma.pc_cat_floor.findUnique({ where: { cat_floor_id: this.num(id, 0) } });
    return { code: 0, message: "success", data: item };
  }

  @Post("create")
  @ApiOperation({ summary: "新增楼层（兼容）" })
  @Authorities("pcCatFloorManage")
  async create(@Body() body: any) {
    const data: any = {
      cat_floor_name: body.cat_floor_name || "",
      category_ids: String(body.category_ids || ""),
      category_names: String(body.category_names || ""),
      floor_ico: body.floor_ico || "",
      hot_cat: body.hot_cat || "",
      is_show: this.num(body.is_show ?? 1, 1),
      sort_order: this.num(body.sort_order ?? 50, 50),
      floor_ico_font: body.floor_ico_font || "",
      brand_ids: String(body.brand_ids || ""),
    };
    const created = await this.prisma.pc_cat_floor.create({ data });
    return { code: 0, message: "success", data: created };
  }

  @Post("update")
  @ApiOperation({ summary: "更新楼层（兼容）" })
  @Authorities("pcCatFloorManage")
  async update(@Body() body: any) {
    const id = this.num(body.cat_floor_id || body.id, 0);
    const data: any = {};
    if (body.cat_floor_name != null) data.cat_floor_name = body.cat_floor_name;
    if (body.category_ids != null) data.category_ids = String(body.category_ids);
    if (body.category_names != null) data.category_names = String(body.category_names);
    if (body.floor_ico != null) data.floor_ico = body.floor_ico;
    if (body.hot_cat != null) data.hot_cat = body.hot_cat;
    if (body.is_show != null) data.is_show = this.num(body.is_show, 1);
    if (body.sort_order != null) data.sort_order = this.num(body.sort_order, 50);
    if (body.floor_ico_font != null) data.floor_ico_font = body.floor_ico_font;
    if (body.brand_ids != null) data.brand_ids = String(body.brand_ids);
    const updated = await this.prisma.pc_cat_floor.update({ where: { cat_floor_id: id }, data });
    return { code: 0, message: "success", data: updated };
  }

  @Post("updateField")
  @ApiOperation({ summary: "更新单字段（兼容）" })
  @Authorities("pcCatFloorManage")
  async updateField(@Body() body: any) {
    const id = this.num(body.id, 0);
    const field = String(body.field || "");
    const val = body.val;
    const allow = ["sort_order", "is_show", "cat_floor_name"];
    if (!id || allow.indexOf(field) === -1) return { code: 1, message: "#field 错误", data: null };
    const data: any = {};
    if (field === "sort_order") data.sort_order = this.num(val, 50);
    if (field === "is_show") data.is_show = this.num(val, 1);
    if (field === "cat_floor_name") data.cat_floor_name = String(val || "");
    await this.prisma.pc_cat_floor.update({ where: { cat_floor_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "删除（兼容）" })
  @Authorities("pcCatFloorManage")
  async del(@Body("id") id: number) {
    await this.prisma.pc_cat_floor.delete({ where: { cat_floor_id: this.num(id, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "批量（兼容，仅del）" })
  @Authorities("pcCatFloorManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.num(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (type === "del" || type === "delete") {
      await this.prisma.pc_cat_floor.deleteMany({ where: { cat_floor_id: { in: ids } } });
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Post("clearCache")
  @ApiOperation({ summary: "清缓存（兼容-占位）" })
  @Authorities("pcCatFloorManage")
  async clearCache() {
    return { code: 0, message: "success", data: true };
  }
}
