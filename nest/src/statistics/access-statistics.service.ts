// @ts-nocheck
import { Injectable } from "@nestjs/common";

@Injectable()
export class AccessStatisticsService {
  async getTotalVisits(shopId: number) {
    return 0;
  }

  async getUniqueVisitors(shopId: number) {
    return 0;
  }

  async getPageViews(shopId: number) {
    return 0;
  }

  async getAvgSessionDuration(shopId: number) {
    return 0; // seconds
  }

  async getAccessTrend(
    shopId: number,
    query: { period?: "hour" | "day" | "week" | "month"; start_date?: string; end_date?: string },
  ) {
    return [] as any;
  }

  async getPageStatistics(shopId: number, limit: number) {
    return [] as any;
  }

  async getAccessSources(shopId: number) {
    return [] as any;
  }

  async getDeviceStatistics(shopId: number, type: "device" | "browser" | "os") {
    return [] as any;
  }

  async getGeographyStatistics(
    shopId: number,
    type: "country" | "province" | "city" = "province",
  ) {
    return [] as any;
  }

  async getRealtimeAccess(shopId: number) {
    return { onlineUsers: 0, pagesPerMin: 0, ts: Date.now() } as any;
  }

  async getConversionStatistics(shopId: number, period: "day" | "week" | "month") {
    return [] as any;
  }

  async exportAccessStatistics(
    shopId: number,
    query: { type: "overview" | "trend" | "pages" | "sources"; format?: "excel" | "csv"; start_date?: string; end_date?: string },
  ) {
    return { url: "", filename: "access-stats.csv" } as any;
  }
}
