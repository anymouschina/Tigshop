// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class AccessStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalVisits(shopId: number) {
    // 以订单总数近似访问次数（无埋点数据时的退化方案）
    return this.prisma.order.count({ where: { shop_id: shopId, is_del: 0 } as any });
  }

  async getUniqueVisitors(shopId: number) {
    const rows = (await this.prisma.$queryRawUnsafe(
      "SELECT COUNT(DISTINCT user_id) AS uv FROM `order` WHERE is_del = 0 AND shop_id = ? AND user_id > 0",
      shopId,
    )) as Array<{ uv: any }>;
    return rows?.[0] ? Number(rows[0].uv) : 0;
  }

  async getPageViews(shopId: number) {
    // 以订单数近似 PV
    return this.getTotalVisits(shopId);
  }

  async getAvgSessionDuration(shopId: number) {
    // 无埋点，返回 0
    return 0;
  }

  async getAccessTrend(
    shopId: number,
    query: { period?: "hour" | "day" | "week" | "month"; start_date?: string; end_date?: string },
  ) {
    const { period = "day" } = query || {};
    const now = new Date();
    const start = query?.start_date ? new Date(query.start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query?.end_date ? new Date(query.end_date) : now;
    const startTs = Math.floor(new Date(start.setHours(0, 0, 0, 0)).getTime() / 1000);
    const endTs = Math.floor(new Date(end.setHours(23, 59, 59, 999)).getTime() / 1000);

    let groupExpr = "DATE(FROM_UNIXTIME(add_time))";
    if (period === "hour") groupExpr = "DATE_FORMAT(FROM_UNIXTIME(add_time), '%Y-%m-%d %H:00')";
    if (period === "week") groupExpr = "YEARWEEK(FROM_UNIXTIME(add_time), 1)";
    if (period === "month") groupExpr = "DATE_FORMAT(FROM_UNIXTIME(add_time), '%Y-%m')";

    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT ${groupExpr} AS period, COUNT(*) AS pv, COUNT(DISTINCT user_id) AS uv
       FROM \`order\`
       WHERE is_del = 0 AND shop_id = ? AND add_time BETWEEN ? AND ?
       GROUP BY period
       ORDER BY period ASC`,
      shopId,
      startTs,
      endTs,
    )) as Array<{ period: any; pv: any; uv: any }>;

    return rows.map((r) => ({ period: String(r.period), pv: Number(r.pv), uv: Number(r.uv) }));
  }

  async getPageStatistics(shopId: number, limit: number) {
    // 使用 order_source 近似页面来源排行
    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT order_source AS page, COUNT(*) AS cnt
       FROM \`order\`
       WHERE is_del = 0 AND shop_id = ?
       GROUP BY order_source
       ORDER BY cnt DESC
       LIMIT ?`,
      shopId,
      Number(limit) || 10,
    )) as Array<{ page: string; cnt: any }>;
    return rows.map((r) => ({ page: r.page || "unknown", count: Number(r.cnt) }));
  }

  async getAccessSources(shopId: number) {
    // 与 getPageStatistics 一致
    return this.getPageStatistics(shopId, 10);
  }

  async getDeviceStatistics(shopId: number, type: "device" | "browser" | "os") {
    // 无埋点数据，返回空
    return [] as any;
  }

  async getGeographyStatistics(
    shopId: number,
    type: "country" | "province" | "city",
  ) {
    if (type === "country") {
      // 默认全部视为 CN
      const rows = (await this.prisma.$queryRawUnsafe(
        `SELECT 'CN' AS country, COUNT(DISTINCT user_id) AS uv
         FROM \`order\` WHERE is_del = 0 AND shop_id = ?`,
        shopId,
      )) as Array<{ country: string; uv: any }>;
      return rows.map((r) => ({ name: r.country, value: Number(r.uv) }));
    }
    if (type === "province") {
      const rows = (await this.prisma.$queryRawUnsafe(
        `SELECT SUBSTRING_INDEX(region_names, ',', 1) AS province, COUNT(DISTINCT user_id) AS uv
         FROM \`order\`
         WHERE is_del = 0 AND shop_id = ? AND region_names IS NOT NULL AND region_names <> ''
         GROUP BY SUBSTRING_INDEX(region_names, ',', 1)
         ORDER BY uv DESC
         LIMIT 100`,
        shopId,
      )) as Array<{ province: string; uv: any }>;
      return rows.map((r) => ({ name: r.province || "未知", value: Number(r.uv) }));
    }
    // city
    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT TRIM(SUBSTRING_INDEX(region_names, ',', -1)) AS city, COUNT(DISTINCT user_id) AS uv
       FROM \`order\`
       WHERE is_del = 0 AND shop_id = ? AND region_names IS NOT NULL AND region_names <> ''
       GROUP BY TRIM(SUBSTRING_INDEX(region_names, ',', -1))
       ORDER BY uv DESC
       LIMIT 100`,
      shopId,
    )) as Array<{ city: string; uv: any }>;
    return rows.map((r) => ({ name: r.city || "未知", value: Number(r.uv) }));
  }

  async getRealtimeAccess(shopId: number) {
    // 最近 10 分钟每分钟订单数
    const now = Math.floor(Date.now() / 1000);
    const start = now - 10 * 60;
    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT DATE_FORMAT(FROM_UNIXTIME(add_time), '%H:%i') AS m, COUNT(*) AS pv
       FROM \`order\`
       WHERE is_del = 0 AND shop_id = ? AND add_time BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(FROM_UNIXTIME(add_time), '%H:%i')
       ORDER BY m ASC`,
      shopId,
      start,
      now,
    )) as Array<{ m: string; pv: any }>;
    return rows.map((r) => ({ minute: r.m, pv: Number(r.pv) }));
  }

  async getConversionStatistics(shopId: number, period: "day" | "week" | "month") {
    const now = new Date();
    let days = 1;
    if (period === "week") days = 7;
    if (period === "month") days = 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startTs = Math.floor(new Date(start.setHours(0, 0, 0, 0)).getTime() / 1000);
    const endTs = Math.floor(new Date(now.setHours(23, 59, 59, 999)).getTime() / 1000);
    const [totalRows, completedRows] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS c FROM \`order\` WHERE is_del = 0 AND shop_id = ? AND add_time BETWEEN ? AND ?`,
        shopId,
        startTs,
        endTs,
      ),
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS c FROM \`order\` WHERE is_del = 0 AND shop_id = ? AND order_status = 3 AND add_time BETWEEN ? AND ?`,
        shopId,
        startTs,
        endTs,
      ),
    ]);
    const total = Number((totalRows as any)[0]?.c || 0);
    const completed = Number((completedRows as any)[0]?.c || 0);
    const rate = total ? (completed / total) * 100 : 0;
    return { total, completed, rate } as any;
  }

  async exportAccessStatistics(
    shopId: number,
    query: { type: "overview" | "trend" | "pages" | "sources"; format?: "excel" | "csv"; start_date?: string; end_date?: string },
  ) {
    const type = query.type;
    let rows: any[] = [];
    if (type === "overview") {
      const [pv, uv, pages] = await Promise.all([
        this.getPageViews(shopId),
        this.getUniqueVisitors(shopId),
        this.getPageStatistics(shopId, 10),
      ]);
      rows = [
        { metric: "pv", value: pv },
        { metric: "uv", value: uv },
        ...(pages as any[]).map((p) => ({ metric: `page:${p.page}`, value: p.count })),
      ];
    } else if (type === "trend") {
      const trend = await this.getAccessTrend(shopId, query as any);
      rows = (trend as any[]).map((t) => ({ period: t.period, pv: t.pv, uv: t.uv }));
    } else if (type === "pages" || type === "sources") {
      const pages = await this.getPageStatistics(shopId, 20);
      rows = (pages as any[]).map((p) => ({ page: p.page, count: p.count }));
    }

    const header = Object.keys(rows[0] || { metric: "metric", value: "value" });
    const dataLines = [header.join(",")].concat(
      rows.map((r) => header.map((h) => String((r as any)[h] ?? "")).join(",")),
    );
    const csv = "\ufeff" + dataLines.join("\r\n");
    const filename = `access-stats-${type}-${Date.now()}.csv`;
    const dir = path.join(process.cwd(), "uploads", "other");
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), csv, { encoding: "utf8" });
      return { url: `/uploads/other/${filename}`, filename } as any;
    } catch (e) {
      return { url: "", filename, error: (e as any)?.message } as any;
    }
  }
}
