// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ProductServicesService } from "./product-services/product-services.service";

@ApiTags("Admin API - 产品服务(兼容路径)")
@Controller("adminapi/product/productServices")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductServicesCompatController {
  constructor(private readonly svc: ProductServicesService) {}

  @Get("list")
  @Authorities("productManage")
  @ApiOperation({ summary: "产品服务列表（admin 兼容）" })
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
  @ApiOperation({ summary: "产品服务详情（admin 兼容）" })
  async detail(@Query("id") id: string) {
    const data = await this.svc.getDetail(Number(id));
    return { code: 0, message: "success", data };
  }

  @Post("create")
  @Authorities("productManage")
  @ApiOperation({ summary: "创建产品服务（admin 兼容）" })
  async create(@Body() body: any) {
    await this.svc.createProductServices(body);
    return { code: 0, message: "success" };
  }

  @Post("update")
  @Authorities("productManage")
  @ApiOperation({ summary: "更新产品服务（admin 兼容）" })
  async update(@Body() body: any) {
    await this.svc.updateProductServices(Number(body.id), body);
    return { code: 0, message: "success" };
  }

  @Post("del")
  @Authorities("productManage")
  @ApiOperation({ summary: "删除产品服务（admin 兼容）" })
  async del(@Body() body: any) {
    await this.svc.deleteProductServices(Number(body.id));
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
      await this.svc.batchDeleteProductServices(body.ids.map((x) => Number(x)));
      return { code: 0, message: "success" };
    }
    return { code: 400, message: "#type 错误" };
  }
}
