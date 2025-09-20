// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { RedisService } from "../redis/redis.service";

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsersToday: number;
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  revenueToday: number;
  conversionRate: number;
  avgOrderValue: number;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topSellingProducts: Array<{
    productId: number;
    productName: string;
    salesCount: number;
    revenue: number;
  }>;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  orderStatusDistribution: Record<string, number>;
}

@Injectable()
export class StatisticService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  // 仪表板统计
  async getDashboardStats(timeRange?: TimeRange): Promise<DashboardStats> {
    const cacheKey = `dashboard_stats:${timeRange?.startDate.toISOString()}:${timeRange?.endDate.toISOString()}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const [
          totalUsers,
          newUsersToday,
          activeUsersToday,
          totalOrders,
          ordersToday,
          totalRevenue,
          revenueToday,
        ] = await Promise.all([
          this.getTotalUsers(),
          this.getNewUsersToday(),
          this.getActiveUsersToday(),
          this.getTotalOrders(),
          this.getOrdersToday(),
          this.getTotalRevenue(),
          this.getRevenueToday(),
        ]);

        const conversionRate =
          newUsersToday > 0 ? (ordersToday / newUsersToday) * 100 : 0;
        const avgOrderValue = ordersToday > 0 ? revenueToday / ordersToday : 0;

        return {
          totalUsers,
          newUsersToday,
          activeUsersToday,
          totalOrders,
          ordersToday,
          totalRevenue,
          revenueToday,
          conversionRate,
          avgOrderValue,
        };
      },
      { ttl: 300 },
    ); // 缓存5分钟
  }

  // 用户统计
  async getUserStats(timeRange: TimeRange): Promise<any> {
    const [totalUsers, newUsers, activeUsers, userGrowthData] =
      await Promise.all([
        this.getTotalUsers(),
        this.getNewUsersByRange(timeRange),
        this.getActiveUsersByRange(timeRange),
        this.getUserGrowthData(timeRange),
      ]);

    return {
      totalUsers,
      newUsers,
      activeUsers,
      userGrowthData,
    };
  }

  // 产品统计
  async getProductStats(): Promise<ProductStats> {
    const cacheKey = "product_stats";

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const [
          totalProducts,
          activeProducts,
          lowStockProducts,
          outOfStockProducts,
          topSellingProducts,
        ] = await Promise.all([
          this.getTotalProducts(),
          this.getActiveProducts(),
          this.getLowStockProducts(),
          this.getOutOfStockProducts(),
          this.getTopSellingProducts(),
        ]);

        return {
          totalProducts,
          activeProducts,
          lowStockProducts,
          outOfStockProducts,
          topSellingProducts,
        };
      },
      { ttl: 600 },
    ); // 缓存10分钟
  }

  // 订单统计
  async getOrderStats(timeRange: TimeRange): Promise<OrderStats> {
    const cacheKey = `order_stats:${timeRange.startDate.toISOString()}:${timeRange.endDate.toISOString()}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const [totalOrders, orderStatusCounts, totalRevenue, avgOrderValue] =
          await Promise.all([
            this.getTotalOrdersByRange(timeRange),
            this.getOrderStatusCounts(timeRange),
            this.getTotalRevenueByRange(timeRange),
            this.getAvgOrderValue(timeRange),
          ]);

        return {
          totalOrders,
          pendingOrders: orderStatusCounts["pending"] || 0,
          processingOrders: orderStatusCounts["processing"] || 0,
          shippedOrders: orderStatusCounts["shipped"] || 0,
          completedOrders: orderStatusCounts["completed"] || 0,
          cancelledOrders: orderStatusCounts["cancelled"] || 0,
          totalRevenue,
          avgOrderValue,
          orderStatusDistribution: orderStatusCounts,
        };
      },
      { ttl: 300 },
    );
  }

  // 销售趋势
  async getSalesTrends(
    timeRange: TimeRange,
    granularity: "day" | "week" | "month" = "day",
  ): Promise<any> {
    const cacheKey = `sales_trends:${timeRange.startDate.toISOString()}:${timeRange.endDate.toISOString()}:${granularity}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const trends = (await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC(${granularity}, created_at) as period,
          COUNT(*) as order_count,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_order_value
        FROM orders
        WHERE created_at >= ${timeRange.startDate}
          AND created_at <= ${timeRange.endDate}
        GROUP BY DATE_TRUNC(${granularity}, created_at)
        ORDER BY period ASC
      `) as any[];

        return trends;
      },
      { ttl: 600 },
    );
  }

  // 地理位置分析
  async getGeoDistribution(timeRange: TimeRange): Promise<any> {
    const cacheKey = `geo_distribution:${timeRange.startDate.toISOString()}:${timeRange.endDate.toISOString()}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const distribution = (await this.prisma.$queryRaw`
        SELECT
          region,
          COUNT(*) as order_count,
          SUM(total_amount) as revenue
        FROM orders
        WHERE created_at >= ${timeRange.startDate}
          AND created_at <= ${timeRange.endDate}
          AND region IS NOT NULL
        GROUP BY region
        ORDER BY revenue DESC
      `) as any[];

        return distribution;
      },
      { ttl: 1800 },
    ); // 缓存30分钟
  }

  // 用户行为分析
  async getUserBehaviorAnalysis(timeRange: TimeRange): Promise<any> {
    const [pageViews, userSessions, bounceRate, avgSessionDuration] =
      await Promise.all([
        this.getPageViews(timeRange),
        this.getUserSessions(timeRange),
        this.getBounceRate(timeRange),
        this.getAvgSessionDuration(timeRange),
      ]);

    return {
      pageViews,
      userSessions,
      bounceRate,
      avgSessionDuration,
    };
  }

  // 私有方法实现
  private async getTotalUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  private async getNewUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.user.count({
      where: {
        created_at: {
          gte: today,
        },
      },
    });
  }

  private async getActiveUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.user.count({
      where: {
        last_login: {
          gte: today,
        },
      },
    });
  }

  private async getTotalOrders(): Promise<number> {
    return this.prisma.order.count();
  }

  private async getOrdersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.order.count({
      where: {
        created_at: {
          gte: today,
        },
      },
    });
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.prisma.order.aggregate({
      _sum: { total_amount: true },
    });

    return result._sum.total_amount || 0;
  }

  private async getRevenueToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.order.aggregate({
      where: {
        created_at: {
          gte: today,
        },
      },
      _sum: { total_amount: true },
    });

    return result._sum.total_amount || 0;
  }

  private async getNewUsersByRange(timeRange: TimeRange): Promise<number> {
    return this.prisma.user.count({
      where: {
        created_at: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
    });
  }

  private async getActiveUsersByRange(timeRange: TimeRange): Promise<number> {
    return this.prisma.user.count({
      where: {
        last_login: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
    });
  }

  private async getUserGrowthData(timeRange: TimeRange): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= ${timeRange.startDate}
        AND created_at <= ${timeRange.endDate}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    ` as any[];
  }

  private async getTotalProducts(): Promise<number> {
    return this.prisma.product.count();
  }

  private async getActiveProducts(): Promise<number> {
    return this.prisma.product.count({
      where: {
        is_enabled: true,
      },
    });
  }

  private async getLowStockProducts(): Promise<number> {
    return this.prisma.product.count({
      where: {
        stock: {
          lte: 10, // 库存小于10视为低库存
        },
        is_enabled: true,
      },
    });
  }

  private async getOutOfStockProducts(): Promise<number> {
    return this.prisma.product.count({
      where: {
        stock: {
          lte: 0,
        },
        is_enabled: true,
      },
    });
  }

  private async getTopSellingProducts(limit = 10): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT
        p.product_id,
        p.product_name,
        SUM(oi.quantity) as sales_count,
        SUM(oi.price * oi.quantity) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.created_at >= NOW() - INTERVAL '30 days'
        AND o.order_status = 'completed'
      GROUP BY p.product_id, p.product_name
      ORDER BY sales_count DESC
      LIMIT ${limit}
    ` as any[];
  }

  private async getTotalOrdersByRange(timeRange: TimeRange): Promise<number> {
    return this.prisma.order.count({
      where: {
        created_at: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
    });
  }

  private async getOrderStatusCounts(
    timeRange: TimeRange,
  ): Promise<Record<string, number>> {
    const results = await this.prisma.order.groupBy({
      by: ["order_status"],
      where: {
        created_at: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      _count: { order_status: true },
    });

    const counts: Record<string, number> = {};
    results.forEach((result) => {
      counts[result.order_status] = result._count.order_status;
    });

    return counts;
  }

  private async getTotalRevenueByRange(timeRange: TimeRange): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        created_at: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      _sum: { total_amount: true },
    });

    return result._sum.total_amount || 0;
  }

  private async getAvgOrderValue(timeRange: TimeRange): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        created_at: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      _avg: { total_amount: true },
    });

    return result._avg.total_amount || 0;
  }

  private async getPageViews(timeRange: TimeRange): Promise<number> {
    // 这里需要根据实际的数据模型来实现
    return 0;
  }

  private async getUserSessions(timeRange: TimeRange): Promise<number> {
    // 这里需要根据实际的数据模型来实现
    return 0;
  }

  private async getBounceRate(timeRange: TimeRange): Promise<number> {
    // 这里需要根据实际的数据模型来实现
    return 0;
  }

  private async getAvgSessionDuration(timeRange: TimeRange): Promise<number> {
    // 这里需要根据实际的数据模型来实现
    return 0;
  }

  // 清除缓存
  async clearCache(): Promise<void> {
    await this.redisService.clearPattern("dashboard_stats:*");
    await this.redisService.clearPattern("product_stats");
    await this.redisService.clearPattern("order_stats:*");
    await this.redisService.clearPattern("sales_trends:*");
    await this.redisService.clearPattern("geo_distribution:*");
  }
}
