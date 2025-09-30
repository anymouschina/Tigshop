// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class GeneralStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(shopId: number, period: "today" | "week" | "month") {
    const now = new Date();
    let days = 1;
    if (period === "week") days = 7;
    if (period === "month") days = 30;
    const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const startTs = Math.floor(start.getTime() / 1000);
    const endTs = Math.floor(end.getTime() / 1000);

    const [orders, revenue, users] = await Promise.all([
      this.prisma.order.count({ where: { shop_id: shopId, is_del: 0, add_time: { gte: startTs, lte: endTs } } as any }),
      this.prisma.order.aggregate({
        where: { shop_id: shopId, is_del: 0, add_time: { gte: startTs, lte: endTs } } as any,
        _sum: { paid_amount: true },
      }),
      this.prisma.user.count({ where: { reg_time: { gte: startTs, lte: endTs } } as any }),
    ]);

    const totalProducts = await this.prisma.product.count({ where: { shop_id: shopId, is_delete: 0 } as any });

    return {
      orders,
      revenue: Number(revenue._sum.paid_amount || 0),
      newUsers: users,
      totalProducts,
    } as any;
  }

  async getFinancialStatistics(
    shopId: number,
    query: { period?: "day" | "week" | "month" | "year"; start_date?: string; end_date?: string },
  ) {
    const { period = "day" } = query || {};
    const now = new Date();
    const start = query?.start_date ? new Date(query.start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query?.end_date ? new Date(query.end_date) : now;
    const startTs = Math.floor(new Date(start.setHours(0, 0, 0, 0)).getTime() / 1000);
    const endTs = Math.floor(new Date(end.setHours(23, 59, 59, 999)).getTime() / 1000);

    let groupExpr = "DATE(FROM_UNIXTIME(add_time))";
    if (period === "week") groupExpr = "YEARWEEK(FROM_UNIXTIME(add_time), 1)";
    if (period === "month") groupExpr = "DATE_FORMAT(FROM_UNIXTIME(add_time), '%Y-%m')";
    if (period === "year") groupExpr = "DATE_FORMAT(FROM_UNIXTIME(add_time), '%Y')";

    // 订单维度聚合（支付与总额）
    const orderRows = (await this.prisma.$queryRawUnsafe(
      `SELECT ${groupExpr} AS period,
              SUM(paid_amount) AS paidAmount,
              SUM(total_amount) AS totalAmount
       FROM \`order\`
       WHERE is_del = 0 AND shop_id = ? AND add_time BETWEEN ? AND ?
       GROUP BY period
       ORDER BY period ASC`,
      shopId,
      startTs,
      endTs,
    )) as Array<{ period: any; paidAmount: any; totalAmount: any }>;

    // 退款维度聚合（以 paylog_refund 为准，时间取退款发生 add_time）
    let refundGroupExpr = "DATE(FROM_UNIXTIME(pr.add_time))";
    if (period === "week") refundGroupExpr = "YEARWEEK(FROM_UNIXTIME(pr.add_time), 1)";
    if (period === "month") refundGroupExpr = "DATE_FORMAT(FROM_UNIXTIME(pr.add_time), '%Y-%m')";
    if (period === "year") refundGroupExpr = "DATE_FORMAT(FROM_UNIXTIME(pr.add_time), '%Y')";
    const refundRows = (await this.prisma.$queryRawUnsafe(
      `SELECT ${refundGroupExpr} AS period, SUM(pr.refund_amount) AS refundAmount
       FROM paylog_refund pr
       INNER JOIN \`order\` o ON o.order_id = pr.order_id
       WHERE o.is_del = 0 AND o.shop_id = ? AND pr.add_time IS NOT NULL AND pr.add_time > 0 AND pr.add_time BETWEEN ? AND ?
       GROUP BY period
       ORDER BY period ASC`,
      shopId,
      startTs,
      endTs,
    )) as Array<{ period: any; refundAmount: any }>;

    const refundMap = new Map<string, number>();
    for (const r of refundRows) {
      refundMap.set(String(r.period), Number(r.refundAmount || 0));
    }

    return orderRows.map((r) => ({
      period: String(r.period),
      paidAmount: Number(r.paidAmount || 0),
      totalAmount: Number(r.totalAmount || 0),
      refundAmount: Number(refundMap.get(String(r.period)) || 0),
    }));
  }

  async getInventoryStatistics(shopId: number) {
    const [totalProducts, activeProducts, lowStockProducts, outOfStock] = await Promise.all([
      this.prisma.product.count({ where: { shop_id: shopId, is_delete: 0 } as any }),
      this.prisma.product.count({ where: { shop_id: shopId, is_delete: 0, product_status: 1 } as any }),
      this.prisma.product.count({ where: { shop_id: shopId, is_delete: 0, product_stock: { lt: 10 } } as any }),
      this.prisma.product.count({ where: { shop_id: shopId, is_delete: 0, product_stock: 0 } as any }),
    ]);
    return { totalProducts, activeProducts, lowStockProducts, outOfStock } as any;
  }

  async getMarketingStatistics(
    shopId: number,
    query: { period?: "day" | "week" | "month"; start_date?: string; end_date?: string },
  ) {
    const now = new Date();
    const start = query?.start_date ? new Date(query.start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query?.end_date ? new Date(query.end_date) : now;
    const startTs = Math.floor(new Date(start.setHours(0, 0, 0, 0)).getTime() / 1000);
    const endTs = Math.floor(new Date(end.setHours(23, 59, 59, 999)).getTime() / 1000);

    const [promoteProducts, couponUsedOrders] = await Promise.all([
      this.prisma.product.count({ where: { shop_id: shopId, is_delete: 0, is_promote: { gt: 0 } } as any }),
      this.prisma.order.count({ where: { shop_id: shopId, is_del: 0, coupon_amount: { gt: 0 }, add_time: { gte: startTs, lte: endTs } } as any }),
    ]);
    const sourceRows = (await this.prisma.$queryRawUnsafe(
      `SELECT order_source AS source, COUNT(*) AS cnt
       FROM \`order\`
       WHERE is_del = 0 AND shop_id = ? AND add_time BETWEEN ? AND ?
       GROUP BY order_source ORDER BY cnt DESC LIMIT 10`,
      shopId,
      startTs,
      endTs,
    )) as Array<{ source: string; cnt: any }>;
    return {
      promoteProducts,
      couponUsedOrders,
      topSources: sourceRows.map((r) => ({ source: r.source || "unknown", count: Number(r.cnt) })),
    } as any;
  }

  async getPerformanceStatistics(query: { period?: "hour" | "day"; start_date?: string; end_date?: string }) {
    // 使用全局维度（无店铺分割）统计吞吐与营收
    const { period = "day" } = query || {};
    const now = new Date();
    const start = query?.start_date ? new Date(query.start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query?.end_date ? new Date(query.end_date) : now;
    const startTs = Math.floor(new Date(start.setHours(0, 0, 0, 0)).getTime() / 1000);
    const endTs = Math.floor(new Date(end.setHours(23, 59, 59, 999)).getTime() / 1000);
    let groupExpr = "DATE(FROM_UNIXTIME(add_time))";
    if (period === "hour") groupExpr = "DATE_FORMAT(FROM_UNIXTIME(add_time), '%Y-%m-%d %H:00')";
    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT ${groupExpr} AS period, COUNT(*) AS orders, SUM(paid_amount) AS revenue
       FROM \`order\`
       WHERE is_del = 0 AND add_time BETWEEN ? AND ?
       GROUP BY period ORDER BY period ASC`,
      startTs,
      endTs,
    )) as Array<{ period: any; orders: any; revenue: any }>;
    return rows.map((r) => ({ period: String(r.period), orders: Number(r.orders || 0), revenue: Number(r.revenue || 0) }));
  }

  async getComparisonData(
    shopId: number,
    query: { type: "sales" | "users" | "orders"; period?: "day" | "week" | "month" | "year"; base_date?: string },
  ) {
    const { type, period = "day" } = query || ({} as any);
    const base = query?.base_date ? new Date(query.base_date) : new Date();
    const rangeDays = period === "day" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 365;
    const currentStart = new Date(base.getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000);
    currentStart.setHours(0, 0, 0, 0);
    const currentEnd = new Date(base);
    currentEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(currentStart.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const prevEnd = new Date(currentEnd.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const ts = (d: Date) => Math.floor(d.getTime() / 1000);

    if (type === "users") {
      const [curr, prev] = await Promise.all([
        this.prisma.user.count({ where: { reg_time: { gte: ts(currentStart), lte: ts(currentEnd) } } as any }),
        this.prisma.user.count({ where: { reg_time: { gte: ts(prevStart), lte: ts(prevEnd) } } as any }),
      ]);
      return { current: curr, previous: prev, diff: curr - prev, rate: prev ? (curr - prev) / prev : 1 } as any;
    }
    if (type === "orders") {
      const [curr, prev] = await Promise.all([
        this.prisma.order.count({ where: { shop_id: shopId, is_del: 0, add_time: { gte: ts(currentStart), lte: ts(currentEnd) } } as any }),
        this.prisma.order.count({ where: { shop_id: shopId, is_del: 0, add_time: { gte: ts(prevStart), lte: ts(prevEnd) } } as any }),
      ]);
      return { current: curr, previous: prev, diff: curr - prev, rate: prev ? (curr - prev) / prev : 1 } as any;
    }
    // sales
    const [curr, prev] = await Promise.all([
      this.prisma.order.aggregate({ where: { shop_id: shopId, is_del: 0, add_time: { gte: ts(currentStart), lte: ts(currentEnd) } } as any, _sum: { paid_amount: true } }),
      this.prisma.order.aggregate({ where: { shop_id: shopId, is_del: 0, add_time: { gte: ts(prevStart), lte: ts(prevEnd) } } as any, _sum: { paid_amount: true } }),
    ]);
    const currVal = Number(curr._sum.paid_amount || 0);
    const prevVal = Number(prev._sum.paid_amount || 0);
    return { current: currVal, previous: prevVal, diff: currVal - prevVal, rate: prevVal ? (currVal - prevVal) / prevVal : 1 } as any;
  }

  async getTrendsAnalysis(
    shopId: number,
    query: { metrics?: string; period?: "day" | "week" | "month"; start_date?: string; end_date?: string },
  ) {
    const metrics = (query?.metrics || "sales,orders").split(",").map((s) => s.trim());
    const { period = "day" } = query || {};
    const now = new Date();
    const start = query?.start_date ? new Date(query.start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query?.end_date ? new Date(query.end_date) : now;
    const startTs = Math.floor(new Date(start.setHours(0, 0, 0, 0)).getTime() / 1000);
    const endTs = Math.floor(new Date(end.setHours(23, 59, 59, 999)).getTime() / 1000);
    let groupExpr = "DATE(FROM_UNIXTIME(add_time))";
    if (period === "week") groupExpr = "YEARWEEK(FROM_UNIXTIME(add_time), 1)";
    if (period === "month") groupExpr = "DATE_FORMAT(FROM_UNIXTIME(add_time), '%Y-%m')";

    const base = (await this.prisma.$queryRawUnsafe(
      `SELECT ${groupExpr} AS period,
              COUNT(*) AS orders,
              SUM(paid_amount) AS sales
       FROM \`order\`
       WHERE is_del = 0 AND shop_id = ? AND add_time BETWEEN ? AND ?
       GROUP BY period ORDER BY period ASC`,
      shopId,
      startTs,
      endTs,
    )) as Array<{ period: any; orders: any; sales: any }>;

    const result: any = { period: base.map((r) => String(r.period)) };
    if (metrics.includes("orders")) result.orders = base.map((r) => Number(r.orders || 0));
    if (metrics.includes("sales")) result.sales = base.map((r) => Number(r.sales || 0));
    if (metrics.includes("users")) {
      // 用户注册趋势（全局，不分店）
      const userRows = (await this.prisma.$queryRawUnsafe(
        `SELECT ${groupExpr.replaceAll("add_time", "reg_time")} AS period, COUNT(*) AS cnt FROM \`user\` WHERE reg_time BETWEEN ? AND ? GROUP BY period ORDER BY period ASC`,
        startTs,
        endTs,
      )) as Array<{ period: any; cnt: any }>;
      const map: Record<string, number> = {};
      userRows.forEach((r) => (map[String(r.period)] = Number(r.cnt || 0)));
      result.users = result.period.map((p: string) => map[p] || 0);
    }
    return result;
  }

  async exportReport(
    shopId: number,
    query: { report_type: "daily" | "weekly" | "monthly" | "yearly"; format?: "pdf" | "excel"; date?: string },
  ) {
    // 生成简易 CSV 报告（excel 仍输出 csv）
    const period = query.report_type === "daily" ? "day" : query.report_type === "weekly" ? "week" : query.report_type === "monthly" ? "month" : "year";
    const financial = await this.getFinancialStatistics(shopId, { period });
    const inventory = await this.getInventoryStatistics(shopId);
    const lines: string[] = [];
    lines.push("period,paidAmount,totalAmount,refundAmount");
    for (const r of financial as any[]) {
      lines.push(`${r.period},${r.paidAmount},${r.totalAmount},${r.refundAmount}`);
    }
    lines.push("");
    lines.push("metric,value");
    lines.push(`totalProducts,${inventory.totalProducts}`);
    lines.push(`activeProducts,${inventory.activeProducts}`);
    lines.push(`lowStockProducts,${inventory.lowStockProducts}`);
    lines.push(`outOfStock,${inventory.outOfStock}`);
    const csv = "\ufeff" + lines.join("\r\n");
    const filename = `general-report-${period}-${Date.now()}.csv`;
    const dir = path.join(process.cwd(), "uploads", "other");
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), csv, { encoding: "utf8" });
      return { url: `/uploads/other/${filename}`, filename } as any;
    } catch (e) {
      return { url: "", filename, error: (e as any)?.message } as any;
    }
  }

  async getRealTimeStatistics(shopId: number) {
    const now = Math.floor(Date.now() / 1000);
    const start = now - 60 * 60; // 最近1小时
    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT DATE_FORMAT(FROM_UNIXTIME(add_time), '%H:%i') AS m, COUNT(*) AS orders, SUM(paid_amount) AS revenue
       FROM \`order\`
       WHERE is_del = 0 AND shop_id = ? AND add_time BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(FROM_UNIXTIME(add_time), '%H:%i')
       ORDER BY m ASC`,
      shopId,
      start,
      now,
    )) as Array<{ m: string; orders: any; revenue: any }>;
    return rows.map((r) => ({ minute: r.m, orders: Number(r.orders || 0), revenue: Number(r.revenue || 0) }));
  }
}
