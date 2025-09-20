// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SalesStatisticsService } from "./sales-statistics.service";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("销售统计")
@Controller("admin/statistics/sales")
@UseGuards(RolesGuard)
@Roles("admin")
export class SalesStatisticsController {
  constructor(
    private readonly salesStatisticsService: SalesStatisticsService,
  ) {}

  @Get("overview")
  @ApiOperation({ summary: "获取销售统计概览" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSalesOverview() {
    const shopId = 1; // TODO: 从token中获取

    const [totalSales, orderCount, avgOrderValue, conversionRate] =
      await Promise.all([
        this.salesStatisticsService.getTotalSales(shopId),
        this.salesStatisticsService.getOrderCount(shopId),
        this.salesStatisticsService.getAvgOrderValue(shopId),
        this.salesStatisticsService.getConversionRate(shopId),
      ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        total_sales: totalSales,
        order_count: orderCount,
        avg_order_value: avgOrderValue,
        conversion_rate: conversionRate,
      },
    };
  }

  @Get("trend")
  @ApiOperation({ summary: "获取销售趋势" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：hour, day, week, month",
    enum: ["hour", "day", "week", "month"],
  })
  @ApiQuery({ name: "start_date", required: false, description: "开始日期" })
  @ApiQuery({ name: "end_date", required: false, description: "结束日期" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSalesTrend(
    @Query()
    query: {
      period?: "hour" | "day" | "week" | "month";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const trend = await this.salesStatisticsService.getSalesTrend(
      shopId,
      query,
    );

    return {
      code: 200,
      message: "获取成功",
      data: trend,
    };
  }

  @Get("products")
  @ApiOperation({ summary: "获取商品销售排行" })
  @ApiQuery({ name: "limit", required: false, description: "返回数量限制" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：day, week, month, year",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getProductSales(
    @Query()
    query: {
      limit?: number;
      period?: "day" | "week" | "month" | "year";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const productSales = await this.salesStatisticsService.getProductSales(
      shopId,
      query,
    );

    return {
      code: 200,
      message: "获取成功",
      data: productSales,
    };
  }

  @Get("categories")
  @ApiOperation({ summary: "获取分类销售统计" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：day, week, month",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCategorySales(
    @Query()
    query: {
      period?: "day" | "week" | "month";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const categorySales = await this.salesStatisticsService.getCategorySales(
      shopId,
      query,
    );

    return {
      code: 200,
      message: "获取成功",
      data: categorySales,
    };
  }

  @Get("payment-methods")
  @ApiOperation({ summary: "获取支付方式统计" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：day, week, month",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getPaymentMethodStatistics(
    @Query()
    query: {
      period?: "day" | "week" | "month";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const paymentStats =
      await this.salesStatisticsService.getPaymentMethodStatistics(
        shopId,
        query,
      );

    return {
      code: 200,
      message: "获取成功",
      data: paymentStats,
    };
  }

  @Get("regions")
  @ApiOperation({ summary: "获取地区销售统计" })
  @ApiQuery({
    name: "level",
    required: false,
    description: "地区级别：province, city",
    enum: ["province", "city"],
  })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：day, week, month",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRegionSales(
    @Query()
    query: {
      level?: "province" | "city";
      period?: "day" | "week" | "month";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const regionSales = await this.salesStatisticsService.getRegionSales(
      shopId,
      query,
    );

    return {
      code: 200,
      message: "获取成功",
      data: regionSales,
    };
  }

  @Get("customers")
  @ApiOperation({ summary: "获取客户销售统计" })
  @ApiQuery({
    name: "type",
    required: false,
    description: "统计类型：top, new, repeat",
    enum: ["top", "new", "repeat"],
  })
  @ApiQuery({ name: "limit", required: false, description: "返回数量限制" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCustomerSales(
    @Query()
    query: {
      type?: "top" | "new" | "repeat";
      limit?: number;
      period?: "day" | "week" | "month";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const customerSales = await this.salesStatisticsService.getCustomerSales(
      shopId,
      query,
    );

    return {
      code: 200,
      message: "获取成功",
      data: customerSales,
    };
  }

  @Get("forecast")
  @ApiOperation({ summary: "获取销售预测" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "预测周期：7, 30, 90",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSalesForecast(@Query("period") period: number = 30) {
    const shopId = 1; // TODO: 从token中获取
    const forecast = await this.salesStatisticsService.getSalesForecast(
      shopId,
      period,
    );

    return {
      code: 200,
      message: "获取成功",
      data: forecast,
    };
  }

  @Get("export")
  @ApiOperation({ summary: "导出销售统计数据" })
  @ApiQuery({
    name: "type",
    required: true,
    description: "导出类型：overview, trend, products, customers",
  })
  @ApiQuery({
    name: "format",
    required: false,
    description: "导出格式：excel, csv",
    enum: ["excel", "csv"],
  })
  @ApiResponse({ status: 200, description: "导出成功" })
  async exportSalesStatistics(
    @Query()
    query: {
      type: "overview" | "trend" | "products" | "customers";
      format?: "excel" | "csv";
      start_date?: string;
      end_date?: string;
    },
  ) {
    const shopId = 1; // TODO: 从token中获取
    const result = await this.salesStatisticsService.exportSalesStatistics(
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
