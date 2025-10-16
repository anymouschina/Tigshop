// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 装修请求(兼容)")
@Controller("adminapi/decorate/decorateRequest")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminDecorateRequestCompatController {
  constructor(private prisma: PrismaService) {}

  private num(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("productList")
  @ApiOperation({ summary: "装修-商品列表（兼容版）" })
  @Authorities("decorateManage")
  async productList(@Query() q: any) {
    const page = Math.max(1, this.num(q.page, 1));
    const size = Math.max(1, this.num(q.size, 10));
    const skip = (page - 1) * size;
    const selectType = this.num(q.product_select_type, 0); // 0:auto 1:manual
    const ids: number[] = (q.product_ids || [])
      .map((x) => this.num(x, 0))
      .filter(Boolean);
    const catId = this.num(q.product_category_id, 0);
    const keyword = (q.product_tag || "").trim();

    const where: any = {};
    if (selectType === 1 && ids.length) {
      where.product_id = { in: ids };
    } else {
      if (catId) where.category_id = catId;
      if (keyword) where.product_name = { contains: keyword };
    }

    const [list, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { product_id: "desc" },
        skip,
        take: size,
        select: {
          product_id: true,
          product_name: true,
          product_sn: true,
          product_price: true,
          market_price: true,
          pic_thumb: true,
          product_status: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { code: 0, message: "success", data: { list, total } };
  }

  @Get("decorateByModule")
  @ApiOperation({ summary: "装修-按模块取数据（占位）" })
  @Authorities("decorateManage")
  async decorateByModule(@Query() q: any) {
    return { code: 0, message: "success", data: [] };
  }
}
