// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ShippingTplService } from "src/setting/shipping-tpl/shippingTpl.service";

@ApiTags("Admin API - 商品运费模板(兼容路径)")
@Controller("adminapi/product/product")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductShippingCompatController {
  constructor(private readonly shippingSvc: ShippingTplService) {}

  // GET /adminapi/product/product/shippingTplList
  @Get("shippingTplList")
  @ApiOperation({ summary: "获取运费模板列表（admin 兼容）" })
  @Authorities("productManage")
  async shippingTplList(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 100;
    const keyword = String(query.keyword || "");
    const result = await this.shippingSvc.getList({ page, size, keyword });
    // 兼容数据结构：records/total
    return {
      code: 0,
      message: "success",
      data: { records: result.records, total: result.total },
    };
  }
}
