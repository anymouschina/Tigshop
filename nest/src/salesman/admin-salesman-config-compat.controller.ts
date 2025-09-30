// @ts-nocheck
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销配置(兼容)")
@Controller("adminapi/salesman/config")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanConfigCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private parseMaybeJson<T = any>(v: any): T | any {
    if (v == null) return v;
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }

  private dftConfig(code: string) {
    if (code === "salesmanConfig") {
      return {
        saleType: 1,
        level: [],
      };
    }
    if (code === "salesmanSettlement") {
      return {
        settlementType: 1, // 1=系统结算 2=人工结算（占位）
        rules: [],
      };
    }
    return {};
  }

  // 获取配置
  @Get("detail")
  @ApiOperation({ summary: "分销配置详情（兼容）" })
  @ApiQuery({ name: "code", required: true, description: "配置编码：salesmanConfig | salesmanSettlement" })
  @Authorities("promoteModeManage", "performanceSettlementSettingManage")
  async detail(@Req() req: any, @Query("code") code: string) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const row = await this.prisma.salesman_config.findFirst({ where: { shop_id: shopId, code } });
    const data = row?.data ? this.parseMaybeJson(row.data) : this.dftConfig(code);
    return { code: 0, message: "success", data };
  }

  // 保存配置
  @Post("save")
  @ApiOperation({ summary: "分销配置保存（兼容）" })
  @ApiQuery({ name: "code", required: true })
  @Authorities("promoteModeManage", "performanceSettlementSettingManage")
  async save(@Req() req: any, @Query("code") code: string, @Body() body: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const exists = await this.prisma.salesman_config.findFirst({ where: { shop_id: shopId, code } });
    const payload = { shop_id: shopId, code, data: JSON.stringify(body) } as any;
    if (exists) {
      await this.prisma.salesman_config.update({ where: { id: exists.id }, data: payload });
    } else {
      await this.prisma.salesman_config.create({ data: payload });
    }
    return { code: 0, message: "success", data: true };
  }
}
