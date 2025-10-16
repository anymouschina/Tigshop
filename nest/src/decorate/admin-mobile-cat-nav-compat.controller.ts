// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 首页分类栏(兼容)")
@Controller("adminapi/decorate/mobileCatNav")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminMobileCatNavCompatController {
  constructor(private prisma: PrismaService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  private parseMaybeJson<T = any>(v: any): T | any {
    if (v == null) return v;
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }

  private toSnakeSortField(field?: string) {
    if (!field) return "mobile_cat_nav_id";
    const map: Record<string, string> = {
      mobileCatNavId: "mobile_cat_nav_id",
      sortOrder: "sort_order",
      isShow: "is_show",
      categoryId: "category_id",
      catNameAlias: "cat_name_alias",
    };
    return map[field] || field;
  }

  // 列表
  @Get("list")
  @ApiOperation({ summary: "首页分类栏列表（兼容）" })
  @Authorities("mobileCatNavManage")
  async list(@Query() query: any) {
    const paging = this.coerceNumber(query.paging, 1); // 1=分页，0=不分页
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;

    const where: any = {};
    const keyword = (query.keyword || "").trim();
    if (keyword) {
      where.cat_name_alias = { contains: keyword };
    }
    const isShow = this.coerceNumber(query.isShow, -1);
    if (isShow > -1) {
      where.is_show = isShow;
    }

    const sortField = this.toSnakeSortField(
      query.sortField || query.sort_field,
    );
    const sortOrder =
      String(query.sortOrder || query.sort_order || "desc").toLowerCase() ===
      "asc"
        ? "asc"
        : "desc";

    // 查询
    const [recordsRaw, total] = await Promise.all([
      this.prisma.mobile_cat_nav.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        ...(paging ? { skip, take: size } : {}),
      }),
      this.prisma.mobile_cat_nav.count({ where }),
    ]);

    // 关联分类名称
    const catIds = Array.from(
      new Set(recordsRaw.map((r) => r.category_id).filter(Boolean)),
    );
    let catNameMap: Record<number, string> = {};
    if (catIds.length) {
      const cats = await this.prisma.category.findMany({
        where: { category_id: { in: catIds } },
        select: { category_id: true, category_name: true },
      });
      catNameMap = Object.fromEntries(
        cats.map((c) => [c.category_id, c.category_name]),
      );
    }

    const records = recordsRaw.map((r) => ({
      ...r,
      category_name: catNameMap[r.category_id] || "",
    }));

    return { code: 0, message: "success", data: { records, total } };
  }

  // 详情
  @Get("detail")
  @ApiOperation({ summary: "首页分类栏详情（兼容）" })
  @Authorities("mobileCatNavManage")
  async detail(@Query("id") id: number) {
    const record = await this.prisma.mobile_cat_nav.findUnique({
      where: { mobile_cat_nav_id: this.coerceNumber(id, 0) },
    });
    if (!record) return { code: 0, message: "success", data: null };

    // 附上分类名称
    let category_name = "";
    if (record.category_id) {
      const cat = await this.prisma.category.findUnique({
        where: { category_id: record.category_id },
        select: { category_name: true },
      });
      category_name = cat?.category_name || "";
    }

    const img_url = this.parseMaybeJson(record.img_url);
    const child_cat_ids = this.parseMaybeJson(record.child_cat_ids);
    const brand_ids = this.parseMaybeJson(record.brand_ids);

    return {
      code: 0,
      message: "success",
      data: {
        ...record,
        category_name,
        img_url,
        child_cat_ids,
        brand_ids,
      },
    };
  }

  // 新增
  @Post("create")
  @ApiOperation({ summary: "添加首页分类栏（兼容）" })
  @Authorities("mobileCatNavManage")
  async create(@Body() body: any) {
    const data: any = {
      category_id: this.coerceNumber(body.category_id || body.categoryId, 0),
      cat_color: body.cat_color ?? body.catColor ?? "",
      img_url: JSON.stringify(body.img_url ?? body.imgUrl ?? []),
      child_cat_ids: JSON.stringify(
        body.child_cat_ids ?? body.childCatIds ?? [],
      ),
      brand_ids: JSON.stringify(body.brand_ids ?? body.brandIds ?? []),
      is_show: this.coerceNumber(body.is_show ?? body.isShow, 1),
      sort_order: this.coerceNumber(body.sort_order ?? body.sortOrder, 50),
      cat_name_alias: body.cat_name_alias ?? body.catNameAlias ?? "",
    };
    const created = await this.prisma.mobile_cat_nav.create({ data });
    return { code: 0, message: "success", data: created };
  }

  // 更新
  @Post("update")
  @ApiOperation({ summary: "更新首页分类栏（兼容）" })
  @Authorities("mobileCatNavManage")
  async update(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const data: any = {};
    if (body.category_id != null || body.categoryId != null)
      data.category_id = this.coerceNumber(
        body.category_id ?? body.categoryId,
        0,
      );
    if (body.cat_color != null || body.catColor != null)
      data.cat_color = body.cat_color ?? body.catColor;
    if (body.img_url != null || body.imgUrl != null)
      data.img_url = JSON.stringify(body.img_url ?? body.imgUrl ?? []);
    if (body.child_cat_ids != null || body.childCatIds != null)
      data.child_cat_ids = JSON.stringify(
        body.child_cat_ids ?? body.childCatIds ?? [],
      );
    if (body.brand_ids != null || body.brandIds != null)
      data.brand_ids = JSON.stringify(body.brand_ids ?? body.brandIds ?? []);
    if (body.is_show != null || body.isShow != null)
      data.is_show = this.coerceNumber(body.is_show ?? body.isShow, 1);
    if (body.sort_order != null || body.sortOrder != null)
      data.sort_order = this.coerceNumber(
        body.sort_order ?? body.sortOrder,
        50,
      );
    if (body.cat_name_alias != null || body.catNameAlias != null)
      data.cat_name_alias = body.cat_name_alias ?? body.catNameAlias;

    const updated = await this.prisma.mobile_cat_nav.update({
      where: { mobile_cat_nav_id: id },
      data,
    });
    return { code: 0, message: "success", data: updated };
  }

  // 更新单个字段（sort_order, is_show）
  @Post("updateField")
  @ApiOperation({ summary: "更新单个字段（兼容）" })
  @Authorities("mobileCatNavManage")
  async updateField(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const field = String(body.field || "");
    if (!id || ["sort_order", "is_show"].indexOf(field) === -1) {
      return { code: 1, message: "#field 错误", data: null };
    }
    const val = body.val;
    const data: any = {
      [field]:
        field === "sort_order"
          ? this.coerceNumber(val, 50)
          : this.coerceNumber(val, 0),
    };
    await this.prisma.mobile_cat_nav.update({
      where: { mobile_cat_nav_id: id },
      data,
    });
    return { code: 0, message: "success", data: true };
  }

  // 删除
  @Post("del")
  @ApiOperation({ summary: "删除首页分类栏（兼容）" })
  @Authorities("mobileCatNavManage")
  async del(@Body("id") id: number) {
    const navId = this.coerceNumber(id, 0);
    if (!navId) return { code: 1, message: "#id 错误", data: null };
    await this.prisma.mobile_cat_nav.delete({
      where: { mobile_cat_nav_id: navId },
    });
    return { code: 0, message: "success", data: true };
  }

  // 批量操作（仅支持 del）
  @Post("batch")
  @ApiOperation({ summary: "批量操作（兼容）" })
  @Authorities("mobileCatNavManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || [])
      .map((x) => this.coerceNumber(x, 0))
      .filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (type === "del" || type === "delete") {
      await this.prisma.mobile_cat_nav.deleteMany({
        where: { mobile_cat_nav_id: { in: ids } },
      });
      return { code: 0, message: "批量操作执行成功！", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }
}
