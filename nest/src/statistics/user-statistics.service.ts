// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class UserStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfDayTs(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
  }

  private endOfDayTs(date: Date): number {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return Math.floor(d.getTime() / 1000);
  }

  private parseRange(query: { start_date?: string; end_date?: string }) {
    const now = new Date();
    const start = query?.start_date
      ? new Date(query.start_date)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query?.end_date ? new Date(query.end_date) : new Date();
    const startTs = this.startOfDayTs(start);
    const endTs = this.endOfDayTs(end);
    return { start, end, startTs, endTs };
  }

  async getTotalUsers(shopId: number) {
    // 平台总用户数（不区分店铺）
    return this.prisma.user.count({ where: { status: { not: 0 } } as any });
  }

  async getNewUsersToday(shopId: number) {
    const startTs = this.startOfDayTs(new Date());
    return this.prisma.user.count({
      where: { reg_time: { gte: startTs } } as any,
    });
  }

  async getActiveUsers(shopId: number) {
    // 近7天登录过的用户
    const sinceTs = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    return this.prisma.user.count({
      where: { last_login: { gte: sinceTs } } as any,
    });
  }

  async getUserGrowth(shopId: number) {
    // 最近30天注册用户数
    const sinceTs = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const count = await this.prisma.user.count({
      where: { reg_time: { gte: sinceTs } } as any,
    });
    return { last30Days: count } as any;
  }

  async getUserTrend(
    shopId: number,
    query: {
      period?: "day" | "week" | "month" | "year";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const { period = "day" } = query || {};
    const { startTs, endTs } = this.parseRange(query || {});

    // 使用 user.reg_time 统计注册趋势（平台维度）
    let groupExpr = Prisma.sql`DATE(FROM_UNIXTIME(reg_time))`;
    if (period === "month")
      groupExpr = Prisma.sql`DATE_FORMAT(FROM_UNIXTIME(reg_time), '%Y-%m')`;
    if (period === "year")
      groupExpr = Prisma.sql`DATE_FORMAT(FROM_UNIXTIME(reg_time), '%Y')`;
    if (period === "week")
      groupExpr = Prisma.sql`YEARWEEK(FROM_UNIXTIME(reg_time), 1)`; // ISO 周

    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT ${period === "week" ? "YEARWEEK(FROM_UNIXTIME(reg_time), 1)" : period === "month" ? "DATE_FORMAT(FROM_UNIXTIME(reg_time), '%Y-%m')" : period === "year" ? "DATE_FORMAT(FROM_UNIXTIME(reg_time), '%Y')" : "DATE(FROM_UNIXTIME(reg_time))"} AS period, COUNT(*) AS count
       FROM \`user\`
       WHERE reg_time BETWEEN ? AND ?
       GROUP BY period
       ORDER BY period ASC`,
      startTs,
      endTs,
    )) as Array<{ period: any; count: any }>;

    return rows.map((r) => ({
      period: String(r.period),
      count: Number(r.count),
    }));
  }

  async getUserDistribution(
    shopId: number,
    type: "region" | "device" | "source",
  ) {
    if (type === "region") {
      // 基于订单的地域分布（按店铺），取 region_names 第一个为省级/大区
      const rows = (await this.prisma.$queryRawUnsafe(
        `SELECT SUBSTRING_INDEX(o.region_names, ',', 1) AS region, COUNT(DISTINCT o.user_id) AS userCount
         FROM \`order\` o
         WHERE o.is_del = 0 AND o.shop_id = ? AND o.user_id > 0 AND o.region_names IS NOT NULL AND o.region_names <> ''
         GROUP BY SUBSTRING_INDEX(o.region_names, ',', 1)
         ORDER BY userCount DESC
         LIMIT 50`,
        shopId,
      )) as Array<{ region: string; userCount: any }>;
      return rows.map((r) => ({
        name: r.region || "未知",
        value: Number(r.userCount),
      }));
    }

    if (type === "source") {
      // 按订单来源统计（按店铺）
      const rows = (await this.prisma.$queryRawUnsafe(
        `SELECT o.order_source AS source, COUNT(DISTINCT o.user_id) AS userCount
         FROM \`order\` o
         WHERE o.is_del = 0 AND o.shop_id = ?
         GROUP BY o.order_source
         ORDER BY userCount DESC`,
        shopId,
      )) as Array<{ source: string; userCount: any }>;
      return rows.map((r) => ({
        name: r.source || "unknown",
        value: Number(r.userCount),
      }));
    }

    // 设备分布暂无数据来源
    return [] as any;
  }

  async getUserRankDistribution(shopId: number) {
    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT rank_id AS rankId, COUNT(*) AS userCount FROM \`user\` GROUP BY rank_id ORDER BY userCount DESC`,
    )) as Array<{ rankId: number; userCount: any }>;
    return rows.map((r) => ({
      rankId: Number(r.rankId),
      count: Number(r.userCount),
    }));
  }

  async getUserActivity(shopId: number, period: "day" | "week" | "month") {
    // 以下单活跃作为活跃定义：统计有下单的去重用户数
    const now = new Date();
    let days = 7;
    if (period === "month") days = 30;
    if (period === "week") days = 7;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startTs = this.startOfDayTs(start);
    const endTs = this.endOfDayTs(now);

    const rows = (await this.prisma.$queryRawUnsafe(
      `SELECT DATE(FROM_UNIXTIME(o.add_time)) AS d, COUNT(DISTINCT o.user_id) AS dau
       FROM \`order\` o
       WHERE o.is_del = 0 AND o.shop_id = ? AND o.add_time BETWEEN ? AND ?
       GROUP BY DATE(FROM_UNIXTIME(o.add_time))
       ORDER BY d ASC`,
      shopId,
      startTs,
      endTs,
    )) as Array<{ d: string; dau: any }>;

    return rows.map((r) => ({ date: r.d, activeUsers: Number(r.dau) }));
  }

  async getUserRetention(shopId: number, period: number) {
    // 简化留存：统计最近 N 天下单用户中，有在前一周期也下过单的比例
    const now = Math.floor(Date.now() / 1000);
    const currStart = now - period * 24 * 60 * 60;
    const prevStart = now - 2 * period * 24 * 60 * 60;
    const prevEnd = currStart - 1;

    const currentUsers = (await this.prisma.$queryRawUnsafe(
      `SELECT DISTINCT o.user_id FROM \`order\` o WHERE o.is_del = 0 AND o.shop_id = ? AND o.add_time BETWEEN ? AND ? AND o.user_id > 0`,
      shopId,
      currStart,
      now,
    )) as Array<{ user_id: number }>;

    if (currentUsers.length === 0)
      return { retentionRate: 0, currentUsers: 0, retainedUsers: 0 } as any;

    const prevUsers = (await this.prisma.$queryRawUnsafe(
      `SELECT DISTINCT o.user_id FROM \`order\` o WHERE o.is_del = 0 AND o.shop_id = ? AND o.add_time BETWEEN ? AND ? AND o.user_id > 0`,
      shopId,
      prevStart,
      prevEnd,
    )) as Array<{ user_id: number }>;

    const prevSet = new Set(prevUsers.map((u) => u.user_id));
    const retained = currentUsers.filter((u) => prevSet.has(u.user_id)).length;
    const rate = currentUsers.length ? retained / currentUsers.length : 0;
    return {
      retentionRate: rate,
      currentUsers: currentUsers.length,
      retainedUsers: retained,
    } as any;
  }

  async exportUserStatistics(
    shopId: number,
    query: {
      type: "overview" | "trend" | "distribution";
      format?: "excel" | "csv";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const fmt = (query.format || "csv").toLowerCase();
    const type = query.type;
    let rows: any[] = [];
    if (type === "overview") {
      const [total, newToday, active, growth] = await Promise.all([
        this.getTotalUsers(shopId),
        this.getNewUsersToday(shopId),
        this.getActiveUsers(shopId),
        this.getUserGrowth(shopId),
      ]);
      rows = [
        { metric: "totalUsers", value: total },
        { metric: "newUsersToday", value: newToday },
        { metric: "activeUsers7d", value: active },
        { metric: "newUsersLast30d", value: (growth as any).last30Days || 0 },
      ];
    } else if (type === "trend") {
      const trend = await this.getUserTrend(shopId, query as any);
      rows = (trend as any[]).map((r) => ({
        period: r.period,
        count: r.count,
      }));
    } else if (type === "distribution") {
      const region = await this.getUserDistribution(shopId, "region");
      rows = (region as any[]).map((r) => ({ name: r.name, value: r.value }));
    }

    // 生成 CSV
    const header = Object.keys(rows[0] || { metric: "metric", value: "value" });
    const dataLines = [header.join(",")].concat(
      rows.map((r) => header.map((h) => String((r as any)[h] ?? "")).join(",")),
    );
    const csv = "\ufeff" + dataLines.join("\r\n"); // UTF-8 BOM + CRLF

    const filename = `user-stats-${type}-${Date.now()}.csv`;
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
