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
    const filter = { ...query, paging: false };
    const records = await this.categoryService.getFilterResult(filter);
    return { code: 0, message: "success", data: records };
  }
}
