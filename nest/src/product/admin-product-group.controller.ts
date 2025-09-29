// @ts-nocheck
import { Controller, Get, Post, Body, Query, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ProductGroupCompatService } from "./product-group-compat.service";

@ApiTags("Admin API - 商品分组管理(兼容路径)")
@Controller("adminapi/product/productGroup")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductGroupController {
  constructor(private readonly service: ProductGroupCompatService) {}

  // 列表：GET /adminapi/product/productGroup/list
  @Get("list")
  @ApiOperation({ summary: "商品分组列表（admin 兼容）" })
  @Authorities("productGroupManage")
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const filter = {
      keyword: query.keyword || "",
      sortField: query.sortField || "",
      sortOrder: query.sortOrder || "",
      page,
      size,
    };
    const [records, total] = await Promise.all([
      this.service.getFilterResult(filter),
      this.service.getFilterCount(filter),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  // 动态 GET：/adminapi/product/productGroup/:act 目前支持 detail
  @Get(":act")
  @ApiOperation({ summary: "商品分组动作（detail）" })
  @Authorities("productGroupManage")
  async getAct(@Param("act") act: string, @Query() query: any) {
    if (act === "detail") {
      const id = Number(query.id);
      const data = await this.service.getDetail(id);
      return { code: 0, message: "success", data };
    }
    // 兼容前端部分场景会在新增时请求 add，这里返回默认空模型
    if (act === "add") {
      return {
        code: 0,
        message: "success",
        data: {
          productGroupId: 0,
          productGroupName: "",
          productGroupSn: "",
          productGroupDescription: "",
          productIds: [],
          addTime: 0,
        },
      };
    }
    return { code: 0, message: "success", data: null };
  }

  // 动态 POST：/adminapi/product/productGroup/:act 支持 create / update
  @Post(":act")
  @ApiOperation({ summary: "商品分组提交（create/update）" })
  @Authorities("productGroupManage")
  async postAct(@Param("act") act: string, @Body() body: any) {
    if (act === "create") {
      const created = await this.service.create(body);
      return { code: 0, message: "success", data: { productGroupId: created.productGroupId } };
    }
    if (act === "update") {
      const id = Number(body.id);
      await this.service.update(id, body);
      return { code: 0, message: "success" };
    }
    return { code: 400, message: "不支持的操作", data: null };
  }

  // 删除：POST /adminapi/product/productGroup/del { id }
  @Post("del")
  @ApiOperation({ summary: "删除商品分组（admin 兼容）" })
  @Authorities("productGroupManage")
  async del(@Body() body: any) {
    const id = Number(body.id);
    await this.service.delete(id);
    return { code: 0, message: "success" };
  }

  // 批量：POST /adminapi/product/productGroup/batch { type: 'del', ids: [] }
  @Post("batch")
  @ApiOperation({ summary: "批量操作（admin 兼容）" })
  @Authorities("productGroupManage")
  async batch(@Body() body: any) {
    const type = String(body.type || "");
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map((x) => Number(x)) : [];
    if (!ids.length) {
      return { code: 400, message: "未选择项目" };
    }
    if (type === "del") {
      await this.service.batchDelete(ids);
      return { code: 0, message: "success" };
    }
    return { code: 400, message: "#type 错误" };
  }
}
