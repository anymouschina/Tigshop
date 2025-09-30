// @ts-nocheck
import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销素材分类(兼容)")
@Controller("adminapi/salesman/category")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanMaterialCategoryCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "素材分类列表（兼容）" })
  @Authorities("materialCategoryManage")
  async list(@Req() req: any, @Query() query: any) {
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const keyword = (query.categoryName || "").trim();
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const where: any = { shop_id: shopId };
    if (keyword) where.category_name = { contains: keyword };
    const [records, total] = await Promise.all([
      this.prisma.salesman_material_category.findMany({ where, orderBy: { category_id: "desc" }, skip, take: size }),
      this.prisma.salesman_material_category.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "素材分类详情（兼容）" })
  @Authorities("materialCategoryManage")
  async detail(@Query("id") id: number) {
    const record = await this.prisma.salesman_material_category.findUnique({ where: { category_id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: record };
  }

  @Post("update")
  @ApiOperation({ summary: "素材分类更新（兼容）" })
  @Authorities("materialCategoryManage")
  async update(@Body() body: any) {
    const id = this.coerceNumber(body.categoryId || body.id, 0);
    const data: any = {
      category_name: body.categoryName ?? "",
      sort_order: this.coerceNumber(body.sortOrder ?? 50, 50),
    };
    if (id) {
      await this.prisma.salesman_material_category.update({ where: { category_id: id }, data });
    } else {
      await this.prisma.salesman_material_category.create({ data });
    }
    return { code: 0, message: "success", data: true };
  }

  @Post("create")
  @ApiOperation({ summary: "素材分类创建（兼容）" })
  @Authorities("materialCategoryManage")
  async create(@Req() req: any, @Body() body: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      category_name: body.categoryName ?? "",
      sort_order: this.coerceNumber(body.sortOrder ?? 50, 50),
      add_time: now,
      shop_id: shopId,
    };
    await this.prisma.salesman_material_category.create({ data });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "素材分类删除（兼容）" })
  @Authorities("materialCategoryManage")
  async del(@Body("id") id: number) {
    await this.prisma.salesman_material_category.delete({ where: { category_id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "素材分类批量（兼容）" })
  @Authorities("materialCategoryManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.coerceNumber(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (type === "del" || type === "delete") {
      await this.prisma.salesman_material_category.deleteMany({ where: { category_id: { in: ids } } });
      return { code: 0, message: "批量操作执行成功！", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Get("config")
  @ApiOperation({ summary: "素材分类配置（兼容）" })
  @Authorities("materialCategoryManage")
  async config() {
    return { code: 0, message: "success", data: {} };
  }
}
