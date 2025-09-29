// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { CategoryService } from "./category.service";

@ApiTags("Admin API - 商品分类管理(兼容路径)")
@Controller("adminapi/product/category")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class AdminApiCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * 兼容前端 product/category/getAllCategory
   */
  @Get("getAllCategory")
  @ApiOperation({ summary: "获取所有商品分类（admin）" })
  async getAllCategory(@Query() query: any) {
    // 返回树形结构并对齐前端期望的字段
    const tree = await this.categoryService.getAllCategoryTree();

    const mapNode = (n: any): any => ({
      categoryId: n.category_id,
      parentId: n.parent_id,
      categoryName: n.category_name,
      sortOrder: n.sort_order,
      isShow: n.is_show,
      categoryPic: n.category_pic,
      // 仅当存在子级时返回 children 字段，避免多余空数组影响部分前端判断
      ...(n.children && n.children.length
        ? { children: n.children.map((c: any) => mapNode(c)) }
        : {}),
    });

    const mappedTree = (tree || []).map((n: any) => mapNode(n));
    return { code: 0, message: "success", data: mappedTree };
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
}
