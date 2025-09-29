// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { ShopProductCategoryService } from "./shop-product-category.service";

@ApiTags("Admin API - 店铺商品分类(兼容路径)")
@Controller("adminapi/merchant/shopProductCategory")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class ShopProductCategoryController {
  constructor(private readonly svc: ShopProductCategoryService) {}

  @Get("list")
  @ApiOperation({ summary: "获取店铺商品分类列表（admin）" })
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const filter = {
      page,
      size,
      keyword: query.keyword ?? "",
      parent_id: query.parentId !== undefined ? Number(query.parentId) : undefined,
      is_show: query.isShow !== undefined && query.isShow !== "" ? Number(query.isShow) : undefined,
      shop_id: query.shopId ? Number(query.shopId) : undefined,
    };
    const { records, total } = await this.svc.list(filter);
    return {
      code: 0,
      message: "success",
      data: {
        records: records.map((r: any) => ({
          categoryId: r.category_id,
          parentId: r.parent_id,
          categoryName: r.category_name,
          sortOrder: r.sort_order,
          isShow: r.is_show,
        })),
        filter: { page },
        parentName: filter.parent_id ? "" : "",
        total,
      },
    };
  }

  @Get("getAllCategory")
  @ApiOperation({ summary: "获取店铺商品分类树（admin）" })
  async getAllCategory(@Query("shopId") shopId?: string) {
    const tree = await this.svc.getAll(shopId ? Number(shopId) : undefined);
    const mapNode = (n: any): any => ({
      categoryId: n.category_id,
      parentId: n.parent_id,
      categoryName: n.category_name,
      sortOrder: n.sort_order,
      isShow: n.is_show,
      ...(n.children && n.children.length ? { children: n.children.map(mapNode) } : {}),
    });
    return { code: 0, message: "success", data: tree.map(mapNode) };
  }

  @Post("create")
  @ApiOperation({ summary: "创建店铺商品分类（admin）" })
  async create(@Body() body: any) {
    const data = {
      category_name: body.categoryName,
      parent_id: body.parentId ? Number(body.parentId) : 0,
      sort_order: body.sortOrder ?? 50,
      is_show: body.isShow ?? 1,
      shop_id: body.shopId ? Number(body.shopId) : 0,
    };
    const created = await this.svc.create(data);
    return { code: 0, message: "success", data: { categoryId: created.category_id } };
  }

  @Post("updateField")
  @ApiOperation({ summary: "更新单个字段（admin）" })
  async updateField(@Body() body: any) {
    await this.svc.updateField(Number(body.id), String(body.field), body.val ?? body.value);
    return { code: 0, message: "success" };
  }

  @Post("del")
  @ApiOperation({ summary: "删除店铺商品分类（admin）" })
  async del(@Body() body: any) {
    await this.svc.delete(Number(body.id));
    return { code: 0, message: "success" };
  }

  @Post("moveCat")
  @ApiOperation({ summary: "转移店铺商品分类商品（admin）" })
  async moveCat(@Body() body: any) {
    await this.svc.moveCat(Number(body.id), Number(body.targetCatId));
    return { code: 0, message: "success" };
  }
}
