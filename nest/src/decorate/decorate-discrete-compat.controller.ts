// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 装修离散块(兼容)")
@Controller("adminapi/decorate/decorateDiscrete")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class DecorateDiscreteCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("detail")
  @ApiOperation({ summary: "获取离散装修片段详情（兼容）" })
  @Authorities("decorateDiscreteDetail")
  async detail(@Query("decorateSn") decorateSn: string, @Query("shopId") shopId?: number) {
    if (!decorateSn) {
      return { code: 0, message: "success", data: null };
    }
    const record = await this.prisma.decorate_discrete.findFirst({
      where: { decorate_sn: decorateSn, shop_id: Number(shopId) || 0 },
    });
    if (!record) return { code: 0, message: "success", data: null };
    let parsed: any = null;
    try {
      parsed = record.data ? JSON.parse(record.data) : null;
    } catch {
      parsed = record.data;
    }
    return {
      code: 0,
      message: "success",
      data: {
        id: record.id,
        decorateSn: record.decorate_sn,
        decorateName: record.decorate_name,
        data: parsed,
        shopId: record.shop_id,
      },
    };
  }
}
