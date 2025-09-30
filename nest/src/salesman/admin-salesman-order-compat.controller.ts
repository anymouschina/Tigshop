// @ts-nocheck
import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";
import type { Response } from "express";

@ApiTags("Admin API - 分销订单(兼容)")
@Controller("adminapi/salesman/order")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanOrderCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) { const n = Number(v); return Number.isFinite(n) ? n : dft; }

  @Get("list")
  @ApiOperation({ summary: "分销订单列表（兼容）" })
  @Authorities("performanceSettlementManage")
  async orderList(@Req() req: any, @Query() query: any) {
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const [records, total] = await Promise.all([
      this.prisma.salesman_order.findMany({ orderBy: { salesman_order_id: "desc" }, skip, take: size }),
      this.prisma.salesman_order.count(),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("export")
  @ApiOperation({ summary: "分销订单导出（兼容）" })
  @Authorities("performanceSettlementManage")
  async orderExport(@Res() res: Response) {
    const bom = Buffer.from("\uFEFF", "utf8");
    const header = "orderId,orderAmount,commission,status\r\n";
    const csv = bom + header; // 占位空数据导出
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="salesman_orders.csv"`);
    res.end(csv);
  }

  // 客户交易相关独立至 AdminSalesmanCustomerTransactionCompatController
}
// @ts-nocheck
import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";
import { Response } from "express";

@ApiTags("Admin API - 分销业绩结算(兼容)")
@Controller("adminapi/salesman/order")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanOrderCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "分销订单列表（兼容）" })
  @Authorities("performanceSettlementManage")
  async list(@Req() req: any, @Query() query: any) {
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const where: any = {};
    const [records, total] = await Promise.all([
      this.prisma.salesman_order.findMany({ where, orderBy: { salesman_order_id: "desc" }, skip, take: size }),
      this.prisma.salesman_order.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("export")
  @ApiOperation({ summary: "导出分销订单（兼容CSV占位）" })
  @Authorities("performanceSettlementManage")
  async export(@Res() res: Response) {
    const csv = "\uFEFFid,orderId,salesmanId,amount,status\r\n"; // UTF-8 BOM + header
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"salesman-orders.csv\"`);
    res.send(csv);
  }
}
