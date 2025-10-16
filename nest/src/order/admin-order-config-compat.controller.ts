import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 订单配置(兼容)")
@Controller("adminapi/order/config")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminOrderConfigCompatController {
  constructor(private readonly prisma: PrismaService) {}

  private getScopeShopId(req: any): number {
    // 简化作用域：优先使用 token 中的 shopId，否则 0（全局配置）
    const sid = Number(req?.user?.shopId ?? 0);
    return Number.isFinite(sid) ? sid : 0;
  }

  /**
   * GET /adminapi/order/config/detail?code=xxx
   * 无 code 时返回当前 shop 的所有配置 map；有 code 时仅返回该 code 的 data
   */
  @Get("detail")
  @Authorities("order")
  @ApiOperation({ summary: "订单配置详情（兼容）" })
  async detail(@Query("code") code: string, @Req() req: any) {
    const shopId = this.getScopeShopId(req);
    if (code) {
      const row = await this.prisma.order_config.findFirst({
        where: { shop_id: shopId, code },
      });
      let data: any = {};
      if (row?.data) {
        try {
          data = JSON.parse(row.data);
        } catch {}
      }
      return { code: 0, message: "success", data };
    }
    const rows = await this.prisma.order_config.findMany({
      where: { shop_id: shopId },
    });
    const map: Record<string, any> = {};
    for (const r of rows) {
      if (!r.code) continue;
      try {
        map[r.code] = r.data ? JSON.parse(r.data) : {};
      } catch {
        map[r.code] = {};
      }
    }
    return { code: 0, message: "success", data: map };
  }

  /**
   * POST /adminapi/order/config/save
   * 支持两种格式：
   * - { code: string, data: any }
   * - { [code: string]: any }（批量保存）
   */
  @Post("save")
  @Authorities("order")
  @ApiOperation({ summary: "保存订单配置（兼容）" })
  async save(@Body() body: any, @Req() req: any) {
    const shopId = this.getScopeShopId(req);
    const upserts: Array<{ code: string; data: any }> = [];
    if (body && typeof body === "object" && !Array.isArray(body)) {
      if (typeof body.code === "string") {
        upserts.push({ code: body.code, data: body.data ?? {} });
      } else {
        for (const k of Object.keys(body)) {
          upserts.push({ code: k, data: body[k] });
        }
      }
    }
    if (!upserts.length)
      return { code: 400, message: "缺少配置数据", data: false };

    await this.prisma.$transaction(async (tx) => {
      for (const it of upserts) {
        const payload = JSON.stringify(it.data ?? {});
        const existing = await tx.order_config.findFirst({
          where: { shop_id: shopId, code: it.code },
        });
        if (existing) {
          await tx.order_config.update({
            where: { id: existing.id },
            data: { data: payload },
          });
        } else {
          await tx.order_config.create({
            data: { shop_id: shopId, code: it.code, data: payload },
          });
        }
      }
    });
    return { code: 0, message: "success", data: true };
  }
}
