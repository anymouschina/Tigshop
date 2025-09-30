// @ts-nocheck
import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销概览(兼容)")
@Controller("adminapi/salesman/overview")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanOverviewCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("coreSummary")
  @ApiOperation({ summary: "分销核心数据汇总（兼容）" })
  @Authorities("overviewManage")
  async coreSummary(@Req() req: any, @Query() query: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    // 新增分销员数（近30天）
    const now = Math.floor(Date.now() / 1000);
    const from = now - 30 * 86400;
    const newSalesmanCount = await this.prisma.salesman.count({ where: { shop_id: shopId, add_time: { gte: from } } });
    // 分销总销售额（累计）
    const orders = await this.prisma.salesman_order.findMany({ where: { salesman_id: { gt: 0 } } });
    const salesmanAmount = orders.reduce((sum, o) => sum + Number(o.order_amount || 0), 0);
    // 分销佣金支出（累计已结算）
    const settled = orders.filter((o) => Number(o.status) === 1);
    const salesmanCommission = settled.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    // 客户数（近30天新增客户去重）
    const customNum = await this.prisma.salesman_customer.groupBy({ by: ["user_id"], where: { add_time: { gte: from } } });
    return { code: 0, message: "success", data: { newSalesmanCount, salesmanAmount, salesmanCommission, customNum: customNum.length } };
  }

  @Get("coreTrend")
  @ApiOperation({ summary: "分销核心指标趋势（兼容）" })
  @Authorities("overviewManage")
  async coreTrend(@Req() req: any, @Query() query: any) {
    const dateType = this.coerceNumber(query.dateType, 0); // 0:今天,1:昨天,2:近7天,3:近30天,4:近半年
    const now = new Date();
    let days = 1;
    if (dateType === 1) days = 1; else if (dateType === 2) days = 7; else if (dateType === 3) days = 30; else if (dateType === 4) days = 180; else days = 1;
    const start = new Date(now.getTime() - (days - 1) * 86400000);
    const horizontalAxis: string[] = [];
    const longitudinalAxis: number[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      horizontalAxis.push(label);
      longitudinalAxis.push(0);
    }
    return { code: 0, message: "success", data: { horizontalAxis, longitudinalAxis } };
  }
}
