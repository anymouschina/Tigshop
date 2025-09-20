// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AccessStatisticsService } from "./access-statistics.service";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("访问统计")
@Controller("admin/statistics/access")
@UseGuards(RolesGuard)
@Roles("admin")
export class AccessStatisticsController {
  constructor(
    private readonly accessStatisticsService: AccessStatisticsService,
  ) {}

  @Get("overview")
  @ApiOperation({ summary: "获取访问统计概览" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAccessOverview() {
    const shopId = 1; // TODO: 从token中获取

    const [totalVisits, uniqueVisitors, pageViews, avgSessionDuration] =
      await Promise.all([
        this.accessStatisticsService.getTotalVisits(shopId),
        this.accessStatisticsService.getUniqueVisitors(shopId),
        this.accessStatisticsService.getPageViews(shopId),
        this.accessStatisticsService.getAvgSessionDuration(shopId),
      ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        total_visits: totalVisits,
        unique_visitors: uniqueVisitors,
        page_views: pageViews,
        avg_session_duration: avgSessionDuration,
      },
    };
  }

  @Get("trend")
  @ApiOperation({ summary: "获取访问趋势" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：hour, day, week, month",
    enum: ["hour", "day", "week", "month"],
  })
  @ApiQuery({ name: "start_date", required: false, description: "开始日期" })
  @ApiQuery({ name: "end_date", required: false, description: "结束日期" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAccessTrend(
    @Query()
    query: {
      period?: "hour" | "day" | "week" | "month";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const trend = await this.accessStatisticsService.getAccessTrend(
      shopId,
      query,
    );

    return {
      code: 200,
      message: "获取成功",
      data: trend,
    };
  }

  @Get("pages")
  @ApiOperation({ summary: "获取页面访问统计" })
  @ApiQuery({ name: "limit", required: false, description: "返回数量限制" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getPageStatistics(@Query("limit") limit: number = 10) {
    const shopId = 1; // TODO: 从token中获取
    const pageStats = await this.accessStatisticsService.getPageStatistics(
      shopId,
      limit,
    );

    return {
      code: 200,
      message: "获取成功",
      data: pageStats,
    };
  }

  @Get("sources")
  @ApiOperation({ summary: "获取访问来源统计" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAccessSources() {
    const shopId = 1; // TODO: 从token中获取
    const sources = await this.accessStatisticsService.getAccessSources(shopId);

    return {
      code: 200,
      message: "获取成功",
      data: sources,
    };
  }

  @Get("devices")
  @ApiOperation({ summary: "获取设备统计" })
  @ApiQuery({
    name: "type",
    required: false,
    description: "设备类型：device, browser, os",
    enum: ["device", "browser", "os"],
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getDeviceStatistics(
    @Query("type") type: "device" | "browser" | "os" = "device",
  ) {
    const shopId = 1; // TODO: 从token中获取
    const deviceStats = await this.accessStatisticsService.getDeviceStatistics(
      shopId,
      type,
    );

    return {
      code: 200,
      message: "获取成功",
      data: deviceStats,
    };
  }

  @Get("geography")
  @ApiOperation({ summary: "获取地理分布统计" })
  @ApiQuery({
    name: "type",
    required: false,
    description: "地理类型：country, province, city",
    enum: ["country", "province", "city"],
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getGeographyStatistics(
    @Query("type") type: "country" | "province" | "city" = "province",
  ) {
    const shopId = 1; // TODO: 从token中获取
    const geography = await this.accessStatisticsService.getGeographyStatistics(
      shopId,
      type,
    );

    return {
      code: 200,
      message: "获取成功",
      data: geography,
    };
  }

  @Get("realtime")
  @ApiOperation({ summary: "获取实时访问数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRealtimeAccess() {
    const shopId = 1; // TODO: 从token中获取
    const realtime =
      await this.accessStatisticsService.getRealtimeAccess(shopId);

    return {
      code: 200,
      message: "获取成功",
      data: realtime,
    };
  }

  @Get("conversion")
  @ApiOperation({ summary: "获取访问转化统计" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：day, week, month",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getConversionStatistics(
    @Query("period") period: "day" | "week" | "month" = "day",
  ) {
    const shopId = 1; // TODO: 从token中获取
    const conversion =
      await this.accessStatisticsService.getConversionStatistics(
        shopId,
        period,
      );

    return {
      code: 200,
      message: "获取成功",
      data: conversion,
    };
  }

  @Get("export")
  @ApiOperation({ summary: "导出访问统计数据" })
  @ApiQuery({
    name: "type",
    required: true,
    description: "导出类型：overview, trend, pages, sources",
  })
  @ApiQuery({
    name: "format",
    required: false,
    description: "导出格式：excel, csv",
    enum: ["excel", "csv"],
  })
  @ApiResponse({ status: 200, description: "导出成功" })
  async exportAccessStatistics(
    @Query()
    query: {
      type: "overview" | "trend" | "pages" | "sources";
      format?: "excel" | "csv";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const result = await this.accessStatisticsService.exportAccessStatistics(
      shopId,
      query,
    );

    return {
      code: 200,
      message: "导出成功",
      data: result,
    };
  }
}
