// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ProductInventoryLogService } from "./product-inventory-log/product-inventory-log.service";

@ApiTags("Admin API - 库存日志(兼容路径)")
@Controller("adminapi/product/productInventoryLog")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductInventoryLogCompatController {
  constructor(private readonly svc: ProductInventoryLogService) {}

  @Get("list")
  @Authorities("productManage")
  @ApiOperation({ summary: "库存日志列表（admin 兼容）" })
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const filter = {
      keyword: query.keyword || "",
      page,
      size,
      sort_field: query.sortField || query.sort_field || "id",
      sort_order: query.sortOrder || query.sort_order || "desc",
    };
    const [records, total] = await Promise.all([
      this.svc.getFilterList(filter),
      this.svc.getFilterCount(filter),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @Authorities("productManage")
  @ApiOperation({ summary: "库存日志详情（admin 兼容）" })
  async detail(@Query("id") id: string) {
    const data = await this.svc.getDetail(Number(id));
    return { code: 0, message: "success", data };
  }

  @Post("create")
  @Authorities("productManage")
  @ApiOperation({ summary: "创建库存日志（admin 兼容）" })
  async create(@Body() body: any) {
    await this.svc.createProductInventoryLog(body);
    return { code: 0, message: "success" };
  }

  @Post("update")
  @Authorities("productManage")
  @ApiOperation({ summary: "更新库存日志（admin 兼容）" })
  async update(@Body() body: any) {
    await this.svc.updateProductInventoryLog(Number(body.id), body);
    return { code: 0, message: "success" };
  }

  @Post("del")
  @Authorities("productManage")
  @ApiOperation({ summary: "删除库存日志（admin 兼容）" })
  async del(@Body() body: any) {
    await this.svc.deleteProductInventoryLog(Number(body.id));
    return { code: 0, message: "success" };
  }

  @Post("batch")
  @Authorities("productManage")
  @ApiOperation({ summary: "批量操作（admin 兼容）" })
  async batch(@Body() body: any) {
    if (!Array.isArray(body.ids) || !body.ids.length) {
      return { code: 400, message: "未选择项目" };
    }
    if (String(body.type) === "del") {
      await this.svc.batchDeleteProductInventoryLog(
        body.ids.map((x) => Number(x)),
      );
      return { code: 0, message: "success" };
    }
    return { code: 400, message: "#type 错误" };
  }

  @Get("statistics")
  @Authorities("productManage")
  @ApiOperation({ summary: "库存日志统计（admin 兼容）" })
  async statistics() {
    const data = await this.svc.getProductInventoryLogStatistics();
    return { code: 0, message: "success", data };
  }
}
