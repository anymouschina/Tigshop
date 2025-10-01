// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ShippingTplService } from "./shippingTpl.service";

@ApiTags("Admin API - 运费模板(兼容路径)")
@Controller("adminapi/setting/shippingTpl")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminShippingTplCompatController {
  constructor(private readonly shippingTplService: ShippingTplService) {}

  // 兼容：GET /adminapi/setting/shippingTpl/list
  @Get("list")
  @Authorities("shippingTplManage")
  @ApiOperation({ summary: "获取运费模板列表（admin 兼容）" })
  async list(@Query() query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.max(1, Number(query.size) || 15);
    const keyword = (query.keyword || "").toString().trim();

    const { records, total } = await this.shippingTplService.findAll({
      page,
      size,
      keyword,
    } as any);

    return {
      code: 0,
      message: "success",
      data: {
        records,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }
}
