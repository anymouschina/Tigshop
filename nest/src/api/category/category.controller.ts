// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CategoryService } from "./category.service";

@ApiTags("用户端商品分类")
@Controller("api/category")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get("list")
  @ApiOperation({ summary: "获取分类列表" })
  @ApiQuery({ name: "parent_id", required: false, description: "父级分类ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async list(@Query() query: { parent_id?: number }) {
    const parentId = query.parent_id || 0;
    return this.categoryService.getCategoryList(parentId);
  }

  @Get("tree")
  @ApiOperation({ summary: "获取分类树" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async tree() {
    return this.categoryService.getCategoryTree();
  }

  @Get("detail/:id")
  @ApiOperation({ summary: "获取分类详情" })
  @ApiParam({ name: "id", description: "分类ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async detail(@Param("id") id: number) {
    return this.categoryService.getCategoryDetail(id);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "获取分类商品" })
  @ApiParam({ name: "id", description: "分类ID" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "sort_field", required: false, description: "排序字段" })
  @ApiQuery({ name: "sort_order", required: false, description: "排序方式" })
  @ApiQuery({ name: "price_min", required: false, description: "最低价格" })
  @ApiQuery({ name: "price_max", required: false, description: "最高价格" })
  @ApiQuery({ name: "keyword", required: false, description: "搜索关键词" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async products(
    @Param("id") categoryId: number,
    @Query()
    query: {
      page?: number;
      size?: number;
      sort_field?: string;
      sort_order?: "asc" | "desc";
      price_min?: number;
      price_max?: number;
      keyword?: string;
    },
  ) {
    return this.categoryService.getCategoryProducts(categoryId, query);
  }

  @Get("hot/:id")
  @ApiOperation({ summary: "获取分类热门商品" })
  @ApiParam({ name: "id", description: "分类ID" })
  @ApiQuery({ name: "limit", required: false, description: "数量限制" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async hotProducts(
    @Param("id") categoryId: number,
    @Query() query: { limit?: number },
  ) {
    const limit = query.limit || 10;
    return this.categoryService.getHotProducts(categoryId, limit);
  }

  @Get("new/:id")
  @ApiOperation({ summary: "获取分类新品" })
  @ApiParam({ name: "id", description: "分类ID" })
  @ApiQuery({ name: "limit", required: false, description: "数量限制" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async newProducts(
    @Param("id") categoryId: number,
    @Query() query: { limit?: number },
  ) {
    const limit = query.limit || 10;
    return this.categoryService.getNewProducts(categoryId, limit);
  }

  @Get("filter/:id")
  @ApiOperation({ summary: "获取分类筛选条件" })
  @ApiParam({ name: "id", description: "分类ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async filter(@Param("id") categoryId: number) {
    return this.categoryService.getCategoryFilter(categoryId);
  }

  @Get("recommend")
  @ApiOperation({ summary: "获取推荐分类" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async recommend() {
    return this.categoryService.getRecommendCategories();
  }

  @Get("breadcrumb/:id")
  @ApiOperation({ summary: "获取分类面包屑导航" })
  @ApiParam({ name: "id", description: "分类ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async breadcrumb(@Param("id") categoryId: number) {
    return this.categoryService.getCategoryBreadcrumb(categoryId);
  }

  @Get("statistics/:id")
  @ApiOperation({ summary: "获取分类统计信息" })
  @ApiParam({ name: "id", description: "分类ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async statistics(@Param("id") categoryId: number) {
    return this.categoryService.getCategoryStatistics(categoryId);
  }

  @Get("children/:id")
  @ApiOperation({ summary: "获取子分类" })
  @ApiParam({ name: "id", description: "分类ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async children(@Param("id") categoryId: number) {
    return this.categoryService.getChildrenCategories(categoryId);
  }
}
