// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalUsers(shopId: number) {
    // Placeholder: replace with real query logic
    return this.prisma.user.count({ where: { shop_id: shopId } as any });
  }

  async getNewUsersToday(shopId: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.prisma.user.count({
      where: { shop_id: shopId, created_at: { gte: startOfDay } } as any,
    });
  }

  async getActiveUsers(shopId: number) {
    // Define activity as having a login within last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.prisma.user.count({
      where: { shop_id: shopId, last_login_time: { gte: since } } as any,
    });
  }

  async getUserGrowth(shopId: number) {
    // Mock growth calculation; replace with real aggregation as needed
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await this.prisma.user.count({
      where: { shop_id: shopId, created_at: { gte: last30 } } as any,
    });
    return { last30Days: count } as any;
  }

  async getUserTrend(
    shopId: number,
    query: { period?: "day" | "week" | "month" | "year"; start_date?: string; end_date?: string },
  ) {
    // Placeholder trend; implement proper bucketing with raw SQL if needed
    return [] as any;
  }

  async getUserDistribution(
    shopId: number,
    type: "region" | "device" | "source",
  ) {
    // Placeholder distributions; implement actual queries based on your schema
    return [] as any;
  }

  async getUserRankDistribution(shopId: number) {
    // Placeholder
    return [] as any;
  }

  async getUserActivity(shopId: number, period: "day" | "week" | "month") {
    // Placeholder
    return [] as any;
  }

  async getUserRetention(shopId: number, period: number) {
    // Placeholder
    return [] as any;
  }

  async exportUserStatistics(
    shopId: number,
    query: { type: "overview" | "trend" | "distribution"; format?: "excel" | "csv"; start_date?: string; end_date?: string },
  ) {
    // Placeholder export result. In real code, build CSV/Excel and return a file URL or buffer.
    return { url: "", filename: "user-stats.csv" } as any;
  }
}
