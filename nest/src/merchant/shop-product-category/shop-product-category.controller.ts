// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { ShopProductCategoryService } from "./shop-product-category.service";
import { Request } from "express";

@ApiTags("Admin API - 店铺商品分类(兼容路径)")
@Controller("adminapi/merchant/shopProductCategory")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class ShopProductCategoryController {
  constructor(private readonly svc: ShopProductCategoryService) {}

  private formatDateTime(ts?: number | null): string {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    const pad = (n: number) => (n < 10 ? "0" + n : String(n));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  @Get("list")
  @ApiOperation({ summary: "获取店铺商品分类列表（admin）" })
  async list(@Query() query: any, @Req() req: Request) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    // 优先 query.shopId 其次 Header X-Shop-Id；若都无则默认 0
    const headerShop =
      req.headers["x-shop-id"] ?? req.headers["X-Shop-Id" as any];
    const headerVal = headerShop !== undefined ? Number(headerShop) : undefined;
    const shopId =
      query.shopId !== undefined
        ? Number(query.shopId)
        : headerVal !== undefined
          ? headerVal
          : 0;
    const filter = {
      page,
      size,
      keyword: query.keyword ?? "",
      parent_id:
        query.parentId !== undefined ? Number(query.parentId) : undefined,
      is_show:
        query.isShow !== undefined && query.isShow !== ""
          ? Number(query.isShow)
          : undefined,
      shop_id: shopId,
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
  async getAllCategory(@Query("shopId") shopId: string, @Req() req: Request) {
    const headerShop =
      req.headers["x-shop-id"] ?? req.headers["X-Shop-Id" as any];
    const parsedHeader =
      headerShop !== undefined ? Number(headerShop) : undefined;
    const resolved =
      shopId !== undefined
        ? Number(shopId)
        : parsedHeader !== undefined
          ? parsedHeader
          : 0;
    const tree = await this.svc.getAll(resolved);
    const mapNode = (n: any): any => ({
      categoryId: n.category_id,
      parentId: n.parent_id,
      categoryName: n.category_name,
      sortOrder: n.sort_order,
      isShow: n.is_show,
      ...(n.children && n.children.length
        ? { children: n.children.map(mapNode) }
        : {}),
    });
    return { code: 0, message: "success", data: tree.map(mapNode) };
  }

  @Post("create")
  @ApiOperation({ summary: "创建店铺商品分类（admin）" })
  async create(@Body() body: any, @Req() req: Request) {
    const headerShop =
      req.headers["x-shop-id"] ?? req.headers["X-Shop-Id" as any];
    const headerVal = headerShop !== undefined ? Number(headerShop) : undefined;
    const resolvedShopId =
      body.shopId !== undefined
        ? Number(body.shopId)
        : headerVal !== undefined
          ? headerVal
          : 0;
    const data = {
      category_name: body.categoryName,
      parent_id: body.parentId ? Number(body.parentId) : 0,
      sort_order: body.sortOrder ?? 50,
      is_show: body.isShow ?? 1,
      shop_id: resolvedShopId,
    };
    const created = await this.svc.create(data);
    return {
      code: 0,
      message: "success",
      data: { categoryId: created.category_id },
    };
  }

  @Post("updateField")
  @ApiOperation({ summary: "更新单个字段（admin）" })
  async updateField(@Body() body: any) {
    await this.svc.updateField(
      Number(body.id),
      String(body.field),
      body.val ?? body.value,
    );
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

  @Get("detail")
  @ApiOperation({ summary: "获取店铺商品分类详情(admin)" })
  async detail(@Query("id") id: string) {
    const cid = Number(id);
    if (!cid) {
      return { code: 0, message: "success", data: null };
    }
    const record = await this.svc.findById(cid);
    if (!record) {
      return { code: 0, message: "success", data: null };
    }
    const childCount = await this.svc.countChildren(cid);
    const data = {
      addTime: this.formatDateTime(record.add_time),
      categoryId: record.category_id,
      parentId: record.parent_id,
      categoryName: record.category_name,
      hasChildren: childCount > 0 ? 1 : 0, // Java 端示例可能返回 null，这里返回 1/0，更易前端判断；若需 null 可改
      isShow: record.is_show,
      shopId: record.shop_id,
      sortOrder: record.sort_order,
      categoryPic: "", // 无该字段，返回空串兼容
    };
    return { code: 0, message: "success", data };
  }
}
