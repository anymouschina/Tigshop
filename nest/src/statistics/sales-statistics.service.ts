// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SalesStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalSales(shopId: number) {
    const result = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        status: "completed",
      },
      _sum: {
        total_amount: true,
      },
    });

    return result._sum.total_amount || 0;
  }

  async getOrderCount(shopId: number) {
    return await this.prisma.order.count({
      where: {
        shop_id: shopId,
        status: "completed",
      },
    });
  }

  async getAvgOrderValue(shopId: number) {
    const result = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        status: "completed",
      },
      _avg: {
        total_amount: true,
      },
    });

    return result._avg.total_amount || 0;
  }

  async getConversionRate(shopId: number) {
    // 计算转化率：已完成订单数 / 总订单数
    const [completedOrders, totalOrders] = await Promise.all([
      this.prisma.order.count({
        where: {
          shop_id: shopId,
          status: "completed",
        },
      }),
      this.prisma.order.count({
        where: {
          shop_id: shopId,
        },
      }),
    ]);

    if (totalOrders === 0) return 0;
    return (completedOrders / totalOrders) * 100;
  }

  async getSalesTrend(shopId: number, query: any) {
    // 根据查询参数获取销售趋势数据
    const { period = "day", start_date, end_date } = query;

    // 这里应该实现具体的销售趋势逻辑
    // 返回示例数据
    return {
      period,
      start_date,
      end_date,
      data: [],
    };
  }

  async getProductSales(shopId: number, query: any) {
    // 获取商品销售排行
    const { limit = 10, period = "day" } = query;

    const products = await this.prisma.order_item.groupBy({
      by: ["product_id"],
      where: {
        order: {
          shop_id: shopId,
          status: "completed",
        },
      },
      _sum: {
        quantity: true,
        price: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    });

    return products;
  }

  async getCategorySales(shopId: number, query: any) {
    // 获取分类销售统计
    const { period = "day" } = query;

    // 这里应该实现具体的分类销售逻辑
    return {
      period,
      data: [],
    };
  }

  async getPaymentMethodStatistics(shopId: number, query: any) {
    // 获取支付方式统计
    const { period = "day" } = query;

    const paymentStats = await this.prisma.order.groupBy({
      by: ["payment_method"],
      where: {
        shop_id: shopId,
        status: "completed",
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        _all: true,
      },
    });

    return paymentStats;
  }

  async getRegionSales(shopId: number, query: any) {
    // 获取地区销售统计
    const { level = "province", period = "day" } = query;

    // 这里应该实现具体的地区销售逻辑
    return {
      level,
      period,
      data: [],
    };
  }

  async getCustomerSales(shopId: number, query: any) {
    // 获取客户销售统计
    const { type = "top", limit = 10, period = "day" } = query;

    // 这里应该实现具体的客户销售逻辑
    return {
      type,
      limit,
      period,
      data: [],
    };
  }

  async getSalesForecast(shopId: number, period: number) {
    // 获取销售预测
    // 这里应该实现具体的销售预测逻辑
    return {
      period,
      forecast: [],
    };
  }

  async exportSalesStatistics(shopId: number, query: any) {
    // 导出销售统计数据
    const { type = "overview", format = "excel" } = query;

    // 这里应该实现具体的导出逻辑
    return {
      type,
      format,
      download_url: "",
    };
  }
}
