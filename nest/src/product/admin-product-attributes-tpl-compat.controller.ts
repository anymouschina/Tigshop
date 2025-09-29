// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ProductAttributesTplService } from "./product-attributes-tpl/product-attributes-tpl.service";

@ApiTags("Admin API - 属性模板(兼容路径)")
@Controller("adminapi/product/productAttributesTpl")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductAttributesTplCompatController {
  constructor(private readonly svc: ProductAttributesTplService) {}

  @Get("list")
  @Authorities("productManage")
  @ApiOperation({ summary: "属性模板列表（admin 兼容）" })
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
    const [recordsRaw, total] = await Promise.all([
      this.svc.getFilterList(filter),
      this.svc.getFilterCount(filter),
    ]);
    // 解析 tpl_data 为对象，交由全局拦截器做蛇转驼
    const records = (recordsRaw || []).map((r: any) => {
      let tplDataParsed: any = null;
      const raw = r?.tpl_data;
      if (raw != null) {
        try {
          tplDataParsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch (e) {
          tplDataParsed = null;
        }
      }
      return { ...r, tpl_data: tplDataParsed };
    });
    const pages = Math.max(1, Math.ceil((total || 0) / size));
    return { code: 0, message: "success", data: { records, total, size, current: page, pages } };
  }

  @Get("detail")
  @Authorities("productManage")
  @ApiOperation({ summary: "属性模板详情（admin 兼容）" })
  async detail(@Query("id") id: string) {
    const raw = await this.svc.getDetail(Number(id));
    let data: any = raw;
    if (raw && typeof raw === "object") {
      let tplDataParsed: any = null;
      const t = (raw as any).tpl_data;
      if (t != null) {
        try {
          tplDataParsed = typeof t === "string" ? JSON.parse(t) : t;
        } catch (e) {
          tplDataParsed = null;
        }
      }
      data = { ...raw, tpl_data: tplDataParsed };
    }
    return { code: 0, message: "success", data };
  }

  @Post("create")
  @Authorities("productManage")
  @ApiOperation({ summary: "创建属性模板（admin 兼容）" })
  async create(@Body() body: any) {
    await this.svc.createProductAttributesTpl(body);
    return { code: 0, message: "success" };
  }

  @Post("update")
  @Authorities("productManage")
  @ApiOperation({ summary: "更新属性模板（admin 兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.tplId ?? body.id);
    const payload: any = { ...body };
    if (payload.tplData && typeof payload.tplData !== "string") {
      payload.tplData = JSON.stringify(payload.tplData);
    }
    await this.svc.updateProductAttributesTpl(id, payload);
    return { code: 0, message: "success" };
  }

  @Post("del")
  @Authorities("productManage")
  @ApiOperation({ summary: "删除属性模板（admin 兼容）" })
  async del(@Body() body: any) {
    const id = Number(body.tplId ?? body.id);
    await this.svc.deleteProductAttributesTpl(id);
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
      await this.svc.batchDeleteProductAttributesTpl(body.ids.map((x) => Number(x)));
      return { code: 0, message: "success" };
    }
    return { code: 400, message: "#type 错误" };
  }
}
