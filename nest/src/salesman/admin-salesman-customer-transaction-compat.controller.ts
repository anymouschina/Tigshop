// @ts-nocheck
import { Controller, Get, Query, UseGuards, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { Response } from "express";

@ApiTags("Admin API - 分销客户交易(兼容)")
@Controller("adminapi/salesman/customerTransaction")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanCustomerTransactionCompatController {
  constructor(private prisma: PrismaService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "客户交易列表（兼容占位）" })
  @Authorities("customerTransactionManage")
  async list(@Query() query: any) {
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    // 占位：无对应表，返回空列表
    return { code: 0, message: "success", data: { records: [], total: 0 } };
  }

  @Get("export")
  @ApiOperation({ summary: "导出客户交易（兼容CSV占位）" })
  @Authorities("customerTransactionManage")
  async export(@Res() res: Response) {
    const csv = "\uFEFFuserId,orderId,amount,addTime\r\n";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"customer-transactions.csv\"`);
    res.send(csv);
  }
}
