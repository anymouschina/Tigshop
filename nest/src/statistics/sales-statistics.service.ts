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

  async getSalesData(shopId: number, timeRange?: string) {
    // 获取销售数据
    // 解析时间范围
    let startDate: Date;
    let endDate: Date = new Date();

    if (timeRange && timeRange.length === 4) {
      // 年份格式：2025
      const year = parseInt(timeRange);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      // 默认今年
      const currentYear = new Date().getFullYear();
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    }

    // 获取当前期间数据
    const [currentOrders, currentRefunds] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          shop_id: shopId,
          status: "completed",
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          total_amount: true,
        },
      }),
      this.prisma.refund.aggregate({
        where: {
          shop_id: shopId,
          status: "completed",
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // 获取上一期间数据（前一年）
    const prevStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
    const prevEndDate = new Date(
      startDate.getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999,
    );

    const [prevOrders, prevRefunds] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          shop_id: shopId,
          status: "completed",
          created_at: {
            gte: prevStartDate,
            lte: prevEndDate,
          },
        },
        _sum: {
          total_amount: true,
        },
      }),
      this.prisma.refund.aggregate({
        where: {
          shop_id: shopId,
          status: "completed",
          created_at: {
            gte: prevStartDate,
            lte: prevEndDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // 获取余额支付数据
    const currentBalanceOrders = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        status: "completed",
        payment_method: "balance",
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        total_amount: true,
      },
    });

    const prevBalanceOrders = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        status: "completed",
        payment_method: "balance",
        created_at: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      _sum: {
        total_amount: true,
      },
    });

    // 获取充值数据
    const currentRecharge = await this.prisma.user_recharge_order.aggregate({
      where: {
        shop_id: shopId,
        status: "completed",
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const prevRecharge = await this.prisma.user_recharge_order.aggregate({
      where: {
        shop_id: shopId,
        status: "completed",
        created_at: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // 计算增长率
    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : -100;
      return ((current - previous) / previous) * 100;
    };

    const productPayment = currentOrders._sum.total_amount || 0;
    const prevProductPayment = prevOrders._sum.total_amount || 0;
    const productRefund = currentRefunds._sum.amount || 0;
    const prevProductRefund = prevRefunds._sum.amount || 0;
    const rechargeAmount = currentRecharge._sum.amount || 0;
    const prevRechargeAmount = prevRecharge._sum.amount || 0;
    const balancePayment = currentBalanceOrders._sum.total_amount || 0;
    const prevBalancePayment = prevBalanceOrders._sum.total_amount || 0;

    return {
      productPayment: Number(productPayment.toFixed(2)),
      productPaymentGrowthRate: Number(
        calculateGrowthRate(productPayment, prevProductPayment).toFixed(4),
      ),
      productRefund: Number(productRefund.toFixed(2)),
      prevProductRefund: Number(prevProductRefund.toFixed(2)),
      productRefundGrowthRate: Number(
        calculateGrowthRate(productRefund, prevProductRefund).toFixed(4),
      ),
      rechargeAmount: Number(rechargeAmount.toFixed(2)),
      rechargeAmountGrowthRate: Number(
        calculateGrowthRate(rechargeAmount, prevRechargeAmount).toFixed(4),
      ),
      turnover: Number(productPayment.toFixed(2)),
      turnoverGrowthRate: Number(
        calculateGrowthRate(productPayment, prevProductPayment).toFixed(4),
      ),
      balancePayment: Number(balancePayment.toFixed(2)),
      balancePaymentGrowthRate: Number(
        calculateGrowthRate(balancePayment, prevBalancePayment).toFixed(4),
      ),
    };
  }

  async getSalesStatisticsData(
    shopId: number,
    dateType: number,
    timeRange?: string,
  ) {
    // 获取销售统计数据图表数据
    let startDate: Date;
    let endDate: Date = new Date();

    if (timeRange && timeRange.length === 4) {
      const year = parseInt(timeRange);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      const currentYear = new Date().getFullYear();
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    }

    // 根据日期类型分组统计
    let groupBy: any;
    if (dateType === 1) {
      // 按月统计
      groupBy = {
        month: {
          $dateTrunc: {
            date: "created_at",
            unit: "month",
          },
        },
      };
    } else {
      // 默认按月统计
      groupBy = {
        month: {
          $dateTrunc: {
            date: "created_at",
            unit: "month",
          },
        },
      };
    }

    // 获取每月销售数据
    const monthlySales = (await this.prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM created_at) as month,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM "order"
      WHERE
        shop_id = ${shopId}
        AND status = 'completed'
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `) as Array<{ month: number; total_amount: number }>;

    // 生成12个月的数据
    const horizontalAxis = Array.from({ length: 12 }, (_, i) =>
      String(i + 1).padStart(2, "0"),
    );

    const longitudinalAxis = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlySales.find((m) => m.month === i + 1);
      return monthData ? Number(monthData.total_amount.toFixed(2)) : 0;
    });

    return {
      horizontalAxis,
      longitudinalAxis,
    };
  }
}
