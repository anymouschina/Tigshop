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
    const pages = Math.max(1, Math.ceil((total || 0) / size));
    return { code: 0, message: "success", data: { records, total, size, current: page, pages } };
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
    const created = await this.svc.createProductServices(body);
    return { code: 0, message: "success", data: created };
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

  /**
   * 兼容前端 product/productServices/updateField
   */
  @Post("updateField")
  @Authorities("productManage")
  @ApiOperation({ summary: "更新产品服务单个字段（admin 兼容）" })
  async updateField(@Body() body: any) {
    const id = Number(body.id);
    const fieldMap: Record<string, string> = {
      productServiceName: "product_service_name",
      name: "product_service_name",
      productServiceDesc: "product_service_desc",
      desc: "product_service_desc",
      icon: "ico_img",
      icoImg: "ico_img",
      sortOrder: "sort_order",
      defaultOn: "default_on",
    };
    const field = fieldMap[body.field] ?? body.field;
    let val = body.val ?? body.value;
    // 基础类型强转
    if (field === "sort_order") {
      if (typeof val === "string") val = parseInt(val, 10);
      if (!Number.isFinite(val)) val = 50;
    }
    if (field === "default_on") {
      if (typeof val === "string") {
        val = val === "1" || val.toLowerCase() === "true" ? 1 : 0;
      } else {
        val = val ? 1 : 0;
      }
    }
    await this.svc.updateField(id, field, val);
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
