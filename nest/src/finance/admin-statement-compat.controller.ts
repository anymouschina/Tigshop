// @ts-nocheck
import { Body, Controller, Get, Post, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { StatementService } from "./statement/statement.service";

@ApiTags("Admin API - 财务/对账单 兼容")
@Controller("adminapi/finance/statement")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminStatementCompatController {
  constructor(private readonly service: StatementService) {}

  // GET getStatementList
  @Get("getStatementList")
  @Authorities("statementManage")
  @ApiOperation({ summary: "对账单列表（admin 兼容）" })
  async getStatementList(@Query() q: any) {
    const result = await this.service.findAll({
      keyword: q.keyword ?? "",
      user_id: Number(q.user_id ?? 0),
      shop_id: Number(q.shop_id ?? 0),
      type: q.type !== undefined ? Number(q.type) : -1,
      status: q.status !== undefined ? Number(q.status) : -1,
      start_date: q.start_date ?? q.startDate,
      end_date: q.end_date ?? q.endDate,
      page: Number(q.page || 1),
      size: Number(q.size || 15),
      sort_field: q.sort_field ?? q.sortField ?? "id",
      sort_order: q.sort_order ?? q.sortOrder ?? "desc",
    });
    return { code: 0, message: "success", data: { records: result.items, total: result.total, page: result.page, size: result.size, total_pages: result.total_pages } };
  }

  // GET getStatementStatisticsList
  @Get("getStatementStatisticsList")
  @Authorities("statementManage")
  @ApiOperation({ summary: "对账单统计（admin 兼容）" })
  async getStatementStatisticsList(@Query() q: any) {
    const data = await this.service.getAmountStats(
      q.start_date && q.end_date
        ? [new Date(q.start_date), new Date(q.end_date)]
        : undefined,
    );
    return { code: 0, message: "success", data };
  }

  // POST saveStatementDownload
  @Post("saveStatementDownload")
  @Authorities("statementManage")
  @ApiOperation({ summary: "保存对账单下载（admin 兼容 - 占位实现）" })
  async saveStatementDownload(@Body() body: any) {
    // 记录下载请求，可接入日志或表；这里直接返回成功
    return { code: 0, message: "success", data: true };
  }

  // GET exportStatement (CSV)
  @Get("exportStatement")
  @Authorities("statementManage")
  @ApiOperation({ summary: "导出对账单（CSV，admin 兼容）" })
  async exportStatement(@Query() q: any, @Res() res: Response) {
    const result = await this.service.findAll({
      keyword: q.keyword ?? "",
      user_id: Number(q.user_id ?? 0),
      shop_id: Number(q.shop_id ?? 0),
      type: q.type !== undefined ? Number(q.type) : -1,
      status: q.status !== undefined ? Number(q.status) : -1,
      start_date: q.start_date ?? q.startDate,
      end_date: q.end_date ?? q.endDate,
      page: 1,
      size: Number(q.size ?? 10000),
      sort_field: q.sort_field ?? q.sortField ?? "id",
      sort_order: q.sort_order ?? q.sortOrder ?? "desc",
    });
    const header = ["id","userId","shopId","type","status","amount","createTime","updateTime","relatedId","adminRemark","description"];
    const rows = (result.items || []).map((it) => [
      it.id,
      it.user_id,
      it.shop_id,
      it.type,
      it.status,
      it.amount,
      it.create_time instanceof Date ? it.create_time.toISOString() : it.create_time,
      it.update_time instanceof Date ? it.update_time.toISOString() : it.update_time,
      it.related_id,
      it.admin_remark ?? "",
      (it.description ?? "").replace(/\r|\n/g, " "),
    ]);
    const csvLines = [
      header.join(","),
      ...rows.map((r) => r.map((v) => {
        const s = String(v ?? "");
        return s.includes(",") || s.includes("\n") || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",")),
    ];
    const csv = csvLines.join("\r\n");
    const buf = Buffer.from("\ufeff" + csv, "utf8");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="statement-${new Date().toISOString().slice(0,10)}.csv"`);
    return res.send(buf);
  }

  // GET exportStatementStatistics (CSV)
  @Get("exportStatementStatistics")
  @Authorities("statementManage")
  @ApiOperation({ summary: "导出对账单统计（CSV，admin 兼容）" })
  async exportStatementStatistics(@Query() q: any, @Res() res: Response) {
    const stats = await this.service.getAmountStats(
      q.start_date && q.end_date
        ? [new Date(q.start_date), new Date(q.end_date)]
        : undefined,
    );
    const header = ["type","totalAmount","count"];
    const lines = [header.join(",")];
    for (const key of Object.keys(stats)) {
      const row = [key, stats[key].total_amount ?? 0, stats[key].count ?? 0];
      lines.push(row.join(","));
    }
    const csv = lines.join("\r\n");
    const buf = Buffer.from("\ufeff" + csv, "utf8");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="statement-stat-${new Date().toISOString().slice(0,10)}.csv"`);
    return res.send(buf);
  }

  // GET getStatementQueryConfig
  @Get("getStatementQueryConfig")
  @Authorities("statementManage")
  @ApiOperation({ summary: "查询字段（admin 兼容 - 占位实现）" })
  async getStatementQueryConfig() {
    const data = {
      statementType: [
        { code: 1, description: "手续费" },
        { code: 2, description: "服务费" },
        { code: 3, description: "订单收支" },
        { code: 4, description: "店铺提现收支" },
        { code: 5, description: "门店提现收支" },
        { code: 6, description: "供应商提现收支" },
      ],
      statementTimeType: [
        { code: 1, description: "入账时间" },
        { code: 2, description: "下单时间" },
      ],
      accountType: [
        { code: 1, description: "账户余额" },
      ],
      entryType: [
        { code: 1, description: "自动" },
        { code: 2, description: "手动" },
      ],
      payMethodType: [
        { code: "wechat", description: "微信" },
        { code: "alipay", description: "支付宝" },
        { code: "paypal", description: "paypal" },
        { code: "offline", description: "线下支付" },
        { code: "balance", description: "余额" },
        { code: "other", description: "其他" },
      ],
      dateComponentType: [
        { code: "day", description: "日" },
        { code: "month", description: "月" },
        { code: "year", description: "年" },
      ],
    };
    return { code: 0, message: "success", data };
  }
}
