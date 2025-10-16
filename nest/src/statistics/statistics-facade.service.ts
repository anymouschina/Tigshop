// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class StatisticsFacadeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // 等价于 legacy: getDashboardStats
  async getDashboardStats(timeRange?: TimeRange) {
    const now = new Date();
    const start =
      timeRange?.startDate ??
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = timeRange?.endDate ?? now;
    const ts = (d: Date) => Math.floor(d.getTime() / 1000);

    const [
      totalUsers,
      newUsersToday,
      totalOrders,
      ordersToday,
      totalRevenueAgg,
      revenueTodayAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          reg_time: { gte: ts(new Date(start)), lte: ts(new Date(end)) },
        } as any,
      }),
      this.prisma.order.count({ where: { is_del: 0 } as any }),
      this.prisma.order.count({
        where: { is_del: 0, add_time: { gte: ts(start), lte: ts(end) } } as any,
      }),
      this.prisma.order.aggregate({
        where: { is_del: 0 } as any,
        _sum: { paid_amount: true },
      }),
      this.prisma.order.aggregate({
        where: { is_del: 0, add_time: { gte: ts(start), lte: ts(end) } } as any,
        _sum: { paid_amount: true },
      }),
    ]);

    const totalRevenue = Number(totalRevenueAgg._sum.paid_amount || 0);
    const revenueToday = Number(revenueTodayAgg._sum.paid_amount || 0);
    const conversionRate =
      newUsersToday > 0 ? (ordersToday / newUsersToday) * 100 : 0;
    const avgOrderValue = ordersToday > 0 ? revenueToday / ordersToday : 0;

    // activeUsersToday（活跃用户）暂无稳定口径，保持为0以兼容结构
    const activeUsersToday = 0;

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
  }

  // 等价于 legacy: getUserStats
  async getUserStats(timeRange: TimeRange) {
    const ts = (d: Date) => Math.floor(d.getTime() / 1000);
    const [totalUsers, newUsers, activeUsers, userGrowthData] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            reg_time: {
              gte: ts(timeRange.startDate),
              lte: ts(timeRange.endDate),
            },
          } as any,
        }),
        Promise.resolve(0), // activeUsers 暂无定义，返回0
        this.prisma.$queryRawUnsafe(
          `SELECT DATE(FROM_UNIXTIME(reg_time)) AS date, COUNT(*) AS new_users
         FROM \`user\`
         WHERE reg_time BETWEEN ? AND ?
         GROUP BY DATE(FROM_UNIXTIME(reg_time))
         ORDER BY date ASC`,
          ts(timeRange.startDate),
          ts(timeRange.endDate),
        ),
      ]);
    return { totalUsers, newUsers, activeUsers, userGrowthData };
  }

  // 等价于 legacy: getProductStats
  async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      this.prisma.product.count({ where: { is_delete: 0 } as any }),
      this.prisma.product.count({
        where: { is_delete: 0, product_status: 1 } as any,
      }),
      this.prisma.product.count({
        where: { is_delete: 0, product_stock: { lt: 10 } } as any,
      }),
      this.prisma.product.count({
        where: { is_delete: 0, product_stock: 0 } as any,
      }),
    ]);

    // 顶部畅销商品：可按需扩展，先返回空数组占位
    const topSellingProducts: Array<{
      productId: number;
      productName: string;
      salesCount: number;
      revenue: number;
    }> = [];

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      topSellingProducts,
    };
  }

  // 等价于 legacy: getOrderStats
  async getOrderStats(timeRange: TimeRange) {
    const ts = (d: Date) => Math.floor(d.getTime() / 1000);
    const totalOrders = await this.prisma.order.count({
      where: {
        is_del: 0,
        add_time: { gte: ts(timeRange.startDate), lte: ts(timeRange.endDate) },
      } as any,
    });

    // 订单状态分布（字段在不同安装可能不一致，这里做最小兼容，全部置0）
    const orderStatusDistribution: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
    };

    const revenueAgg = await this.prisma.order.aggregate({
      where: {
        is_del: 0,
        add_time: { gte: ts(timeRange.startDate), lte: ts(timeRange.endDate) },
      } as any,
      _sum: { paid_amount: true },
    });
    const totalRevenue = Number(revenueAgg._sum.paid_amount || 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return {
      totalOrders,
      orderStatusDistribution,
      totalRevenue,
      avgOrderValue,
    };
  }

  // 等价于 legacy: clearCache
  async clearCache(): Promise<void> {
    // 与 legacy 清理的 key 保持一致
    await this.redisService.clearPattern("dashboard_stats:*");
    await this.redisService.clearPattern("product_stats");
    await this.redisService.clearPattern("order_stats:*");
    await this.redisService.clearPattern("sales_trends:*");
    await this.redisService.clearPattern("geo_distribution:*");
  }
}
