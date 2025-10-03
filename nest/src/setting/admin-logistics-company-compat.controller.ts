// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { LogisticsCompanyService } from "./logistics-company.service";

@ApiTags("Admin API - 物流公司(兼容路径)")
@Controller("adminapi/setting/logisticsCompany")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminLogisticsCompanyCompatController {
  constructor(private readonly svc: LogisticsCompanyService) {}

  @Get("list")
  @Authorities("setting")
  @ApiOperation({ summary: "物流公司列表（admin 兼容）" })
  async list(@Query() query: any) {
    // 兼容参数：paging 可以是 'false'/'0'/false；logisticsId 与 logistics_id 皆可
    const pagingRaw = query.paging;
    const paging = pagingRaw === undefined ? true : !((String(pagingRaw)).toLowerCase() === "false" || String(pagingRaw) === "0");
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const filter: any = {
      keyword: query.keyword,
      logistics_id: Number(query.logistics_id ?? query.logisticsId) || undefined,
      paging,
      page,
      size,
      sort_field: query.sortField ?? query.sort_field,
      sort_order: query.sortOrder ?? query.sort_order,
    };
    // 统一字段映射为前端期望的驼峰结构
    const mapRow = (r: any) => ({
      logisticsId: r.logistics_id,
      logisticsCode: r.logistics_code,
      logisticsName: r.logistics_name,
      logisticsDesc: r.logistics_desc,
      sortOrder: r.sort_order,
      isShow: r.is_show,
      shopId: r.shop_id,
      customerName: r.customer_name ?? "",
      customerPwd: r.customer_pwd ?? "",
      monthCode: r.month_code ?? "",
      sendSite: r.send_site ?? "",
      sendStaff: r.send_staff ?? "",
      expType: r.exp_type ?? "",
      apiLogisticsCode: r.api_logistics_code ?? "",
    });

    if (!filter.paging) {
      const raw = await this.svc.getFilterResult(filter);
      const records = raw.map(mapRow);
      const total = records.length;
      return { code: 0, message: "success", data: { records, total } };
    }

    const [raw, total] = await Promise.all([
      this.svc.getFilterResult(filter),
      this.svc.getFilterCount(filter),
    ]);
    const records = raw.map(mapRow);
    const data = {
      records,
      total,
      size: filter.size,
      current: filter.page,
      pages: Math.max(1, Math.ceil((total || 0) / filter.size)),
    };
    return { code: 0, message: "success", data };
  }
}
