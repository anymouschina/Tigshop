// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards, Req, Logger } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { CategoryService } from "./category.service";
import { ShopProductCategoryService } from "src/merchant/shop-product-category/shop-product-category.service";
import { Request } from "express";

@ApiTags("Admin API - 商品分类管理(兼容路径)")
@Controller("adminapi/product/category")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class AdminApiCategoryController {
  private logger = new Logger(AdminApiCategoryController.name);
  constructor(
    private readonly categoryService: CategoryService,
    private readonly shopProductCategoryService: ShopProductCategoryService,
  ) {}

  /**
   * 兼容前端 product/category/getAllCategory
   */
  @Get("getAllCategory")
  @ApiOperation({ summary: "获取所有商品分类（admin）" })
  async getAllCategory(@Query() query: any, @Req() req: Request) {
    // 按 PHP 原始逻辑：此接口只返回“平台商品分类”树，不混入店铺私有分类。
    const tree = await this.categoryService.getAllCategoryTree();
    const mapNode = (n: any): any => ({
      categoryId: n.category_id,
      parentId: n.parent_id,
      categoryName: n.category_name,
      sortOrder: n.sort_order,
      isShow: n.is_show,
      categoryPic: n.category_pic,
      ...(n.children && n.children.length ? { children: n.children.map((c: any) => mapNode(c)) } : {}),
    });
    return { code: 0, message: 'success', data: (tree || []).map((n: any) => mapNode(n)) };
  }

  /**
   * 兼容前端 product/category/list
   * 入参(前端定义 CategoryFilterParams):
   * - page, size, sortField, sortOrder, keyword, isShow, parentId
   * 返回(前端定义 CategoryFilterResult):
   * - { records: CategoryFilterState[], filter: { page }, parentName, total }
   */
  @Get("list")
  @ApiOperation({ summary: "获取商品分类列表（admin 兼容）" })
  async list(@Query() query: any) {
    // 参数映射：前端驼峰 -> 服务层下划线
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 10;
    const mappedFilter = {
      keyword: query.keyword ?? "",
      parent_id:
        query.parentId !== undefined ? Number(query.parentId) : undefined,
      is_show:
        query.isShow !== undefined && query.isShow !== ""
          ? Number(query.isShow)
          : undefined,
      sort_field: query.sortField || undefined,
      sort_order: query.sortOrder || undefined,
      page,
      size,
      paging: true,
    };

    const [records, total] = await Promise.all([
      this.categoryService.getFilterResult(mappedFilter),
      this.categoryService.getFilterCount(mappedFilter),
    ]);

    // 构建前端期望的字段与 hasChildren
    const ids = records.map((r: any) => r.category_id);
    const childMap = await this.categoryService.hasChildrenForIds(ids);
    const mappedRecords = records.map((r: any) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryPic: r.category_pic,
      categoryIco: r.category_ico,
      measureUnit: r.measure_unit,
      isHot: r.is_hot,
      isShow: r.is_show,
      sortOrder: r.sort_order,
      parentId: r.parent_id,
      hasChildren: childMap[r.category_id] ? 1 : 0,
    }));

    const parentId = mappedFilter.parent_id ?? 0;
    const parentName = await this.categoryService.getParentName(parentId);

    return {
      code: 0,
      message: "success",
      data: {
        records: mappedRecords,
        filter: { page },
        parentName,
        total,
      },
    };
  }

  /**
   * 兼容前端 product/category/detail
   * 入参: id (number)
   * 返回: 单条分类详情，字段为驼峰
   */
  @Get("detail")
  @ApiOperation({ summary: "获取商品分类详情（admin 兼容）" })
  async detail(@Query("id") id: string) {
    const categoryId = Number(id);
    const item = await this.categoryService.getDetail(categoryId);
    const parentName = await this.categoryService.getParentName(item.parent_id);

    // 映射为前端期望的驼峰字段
    const data = {
      categoryId: item.category_id,
      parentId: item.parent_id,
      parentName,
      categoryName: item.category_name,
      shortName: item.short_name,
      categoryPic: item.category_pic,
      categoryIco: item.category_ico,
      measureUnit: item.measure_unit,
      seoTitle: item.seo_title,
      searchKeywords: item.search_keywords,
      keywords: item.keywords,
      categoryDesc: item.category_desc,
      isHot: item.is_hot,
      isShow: item.is_show,
      sortOrder: item.sort_order,
      // 名称显示（服务层已提供）
      showName: item.show_name,
      hotName: item.hot_name,
    };

    return { code: 0, message: "success", data };
  }

  /**
   * 兼容前端 product/category/update
   * 入参(body)：{ id, categoryName, shortName, parentId, categoryPic, categoryIco, measureUnit, seoTitle, searchKeywords, keywords, categoryDesc, isHot, isShow, sortOrder }
   */
  @Post("update")
  @ApiOperation({ summary: "更新商品分类（admin 兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.id);
    const data = this.mapCamelToSnake(body);
    await this.categoryService.update(id, data);
    return { code: 0, message: "success" };
  }

  /**
   * 兼容前端 product/category/del
   */
  @Post("del")
  @ApiOperation({ summary: "删除商品分类（admin 兼容）" })
  async del(@Body() body: any) {
    const id = Number(body.id);
    await this.categoryService.delete(id);
    return { code: 0, message: "success" };
  }

  /**
   * 兼容前端 product/category/create
   * 入参同上但不带 id
   */
  @Post("create")
  @ApiOperation({ summary: "创建商品分类（admin 兼容）" })
  async create(@Body() body: any) {
    const data = this.mapCamelToSnake(body);
    const created = await this.categoryService.create(data);
    return { code: 0, message: "success", data: { categoryId: created.category_id } };
  }

  /**
   * 兼容前端 product/category/moveCat
   * body: { id, targetCatId }
   */
  @Post("moveCat")
  @ApiOperation({ summary: "商品转移分类（admin 兼容）" })
  async moveCat(@Body() body: any) {
    const id = Number(body.id);
    const targetCatId = Number(body.targetCatId);
    await this.categoryService.moveCategoryProducts(id, targetCatId);
    return { code: 0, message: "success" };
  }

  /**
   * 兼容前端 product/category/updateField
   * 入参(body)：{ id, field, value }；field 可能为驼峰，需转换
   */
  @Post("updateField")
  @ApiOperation({ summary: "更新商品分类字段（admin 兼容）" })
  async updateField(@Body() body: any) {
    const id = Number(body.id);
    const field = this.mapFieldCamelToSnake(String(body.field));
    // 兼容前端可能传 val 或 value，两种都支持
    let value = body.value ?? body.val;
    // 针对部分需要数值的字段进行数值化
    const numericFields = new Set([
      "sort_order",
      "parent_id",
      "is_hot",
      "is_show",
    ]);
    if (numericFields.has(field)) {
      value = value === '' || value === null || value === undefined ? 0 : Number(value);
      if (Number.isNaN(value)) value = 0;
    }
    await this.categoryService.updateField(id, field, value);
    return { code: 0, message: "success" };
  }

  // 将驼峰表单数据转换为服务层所需下划线字段
  private mapCamelToSnake(input: any) {
    const out: any = {};
    const map: Record<string, string> = {
      categoryId: "category_id",
      categoryName: "category_name",
      shortName: "short_name",
      parentId: "parent_id",
      categoryPic: "category_pic",
      categoryIco: "category_ico",
      measureUnit: "measure_unit",
      seoTitle: "seo_title",
      searchKeywords: "search_keywords",
      keywords: "keywords",
      categoryDesc: "category_desc",
      isHot: "is_hot",
      isShow: "is_show",
      sortOrder: "sort_order",
    };

    for (const k of Object.keys(input || {})) {
      if (k === "id") continue; // id 单独处理
      const target = map[k];
      if (target !== undefined) {
        out[target] = input[k];
      }
    }
    // 兜底：若已有下划线字段也允许直接透传
    const allowed = new Set(Object.values(map));
    for (const k of Object.keys(input || {})) {
      if (allowed.has(k)) out[k] = input[k];
    }
    return out;
  }

  // 将单字段名从驼峰映射为下划线
  private mapFieldCamelToSnake(field: string) {
    const map: Record<string, string> = {
      categoryId: "category_id",
      categoryName: "category_name",
      shortName: "short_name",
      parentId: "parent_id",
      categoryPic: "category_pic",
      categoryIco: "category_ico",
      measureUnit: "measure_unit",
      seoTitle: "seo_title",
      searchKeywords: "search_keywords",
      keywords: "keywords",
      categoryDesc: "category_desc",
      isHot: "is_hot",
      isShow: "is_show",
      sortOrder: "sort_order",
    };
    return map[field] ?? field;
  }
}
