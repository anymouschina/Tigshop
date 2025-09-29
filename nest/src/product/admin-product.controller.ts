// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { ProductService } from "./product.service";

@ApiTags("Admin API - 商品管理")
@Controller("adminapi/product/product")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class AdminApiProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * 商品列表（adminapi）- 映射前端 product/product/list
   */
  @Get("list")
  @ApiOperation({ summary: "获取商品列表（admin）" })
  async getList(@Query() query: any) {
    const result = await this.productService.findAll(query);
    return {
      code: 0,
      message: "success",
      data: {
        records: result.records || [],
        filter: { page: Number(query?.page) || 1 },
        total: result.total || 0,
        waitingCheckedCount: result.waitingCheckedCount || 0,
      },
    };
  }

  /**
   * 待审核商品数量（adminapi）- 映射前端 product/product/getWaitingCheckedCount
   */
  @Get("getWaitingCheckedCount")
  @ApiOperation({ summary: "获取待审核商品数量（admin）" })
  async getWaitingCheckedCount(@Query() query: any) {
    const count = await this.productService.getWaitingCheckedCount(query);
    return { code: 0, message: "success", data: count };
  }
}
