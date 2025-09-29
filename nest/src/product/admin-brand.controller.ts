// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { BrandService } from "./brand.service";

@ApiTags("Admin API - 品牌管理(兼容路径)")
@Controller("adminapi/product/brand")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class AdminApiBrandController {
  constructor(private readonly brandService: BrandService) {}

  /**
   * 兼容前端 product/brand/search
   */
  @Get("search")
  @ApiOperation({ summary: "搜索品牌（admin）" })
  async search(@Query("word") word?: string) {
    const result = await this.brandService.searchBrands(word || "");
    // 前端定义 BrandSearchFilterResult:
    // { brandList: BrandFilterState[]; firstWordList: string[]; message: string; errcode: number; }
    return {
      code: 0,
      message: "success",
      data: {
        brandList: result.brand_list || [],
        firstWordList: result.firstWord_list || [],
        message: "success",
        errcode: 0,
      },
    };
  }

  /**
   * 兼容前端 product/brand/auditWaitNum
   */
  @Get("auditWaitNum")
  @ApiOperation({ summary: "获取待审核品牌数量（admin）" })
  async auditWaitNum() {
    const count = await this.brandService.getAuditWaitCount();
    return { code: 0, message: "success", data: count };
  }
}
