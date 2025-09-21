// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { StatisticService } from "../statistic/statistic.service";
import { LogService } from "../log/log.service";
import { NotificationService } from "../notification/notification.service";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private statisticService: StatisticService,
    private logService: LogService,
    private notificationService: NotificationService,
  ) {}

  // 每天凌晨执行数据统计
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyStatistics() {
    try {
      this.logger.log("Running daily statistics job...");

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const timeRange = {
        startDate: yesterday,
        endDate: today,
      };

      // 获取统计数据
      const [dashboardStats, userStats, productStats, orderStats] =
        await Promise.all([
          this.statisticService.getDashboardStats(timeRange),
          this.statisticService.getUserStats(timeRange),
          this.statisticService.getProductStats(),
          this.statisticService.getOrderStats(timeRange),
        ]);

      // 保存统计数据到数据库
      await this.prisma.dailyStatistic.create({
        data: {
          date: yesterday,
          total_users: dashboardStats.totalUsers,
          new_users: dashboardStats.newUsersToday,
          active_users: dashboardStats.activeUsersToday,
          total_orders: dashboardStats.totalOrders,
          daily_orders: dashboardStats.ordersToday,
          total_revenue: dashboardStats.totalRevenue,
          daily_revenue: dashboardStats.revenueToday,
          conversion_rate: dashboardStats.conversionRate,
          avg_order_value: dashboardStats.avgOrderValue,
          total_products: productStats.totalProducts,
          active_products: productStats.activeProducts,
          low_stock_products: productStats.lowStockProducts,
          out_of_stock_products: productStats.outOfStockProducts,
          metadata: {
            userStats,
            orderStats,
          },
        },
      });

      // 清除相关缓存
      await this.statisticService.clearCache();

      this.logger.log("Daily statistics job completed successfully");
    } catch (error) {
      this.logger.error("Daily statistics job failed:", error);
      await this.logService.error("Daily statistics job failed", {
        error: error.message,
      });
    }
  }

  // 每小时执行缓存预热
  @Cron(CronExpression.EVERY_HOUR)
  async cacheWarmup() {
    try {
      this.logger.log("Running cache warmup job...");

      // 预热热门产品缓存
      await this.warmupPopularProductsCache();

      // 预热分类缓存
      await this.warmupCategoriesCache();

      // 预热品牌缓存
      await this.warmupBrandsCache();

      this.logger.log("Cache warmup job completed successfully");
    } catch (error) {
      this.logger.error("Cache warmup job failed:", error);
      await this.logService.error("Cache warmup job failed", {
        error: error.message,
      });
    }
  }

  // 每5分钟检查订单状态
  @Cron("*/5 * * * *")
  async checkOrderStatus() {
    try {
      this.logger.log("Running order status check job...");

      // 检查超时未支付的订单
      await this.checkTimeoutOrders();

      // 检查自动确认收货的订单
      await this.checkAutoConfirmOrders();

      // 检查需要发送提醒的订单
      await this.checkOrderReminders();

      this.logger.log("Order status check job completed successfully");
    } catch (error) {
      this.logger.error("Order status check job failed:", error);
      await this.logService.error("Order status check job failed", {
        error: error.message,
      });
    }
  }

  // 每天清理过期数据
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredData() {
    try {
      this.logger.log("Running cleanup job...");

      // 清理过期的验证码
      await this.cleanupExpiredVerificationCodes();

      // 清理过期的令牌
      await this.cleanupExpiredTokens();

      // 清理过期的缓存
      await this.cleanupExpiredCache();

      // 清理日志（保留90天）
      const deletedLogsCount = await this.logService.cleanupOldLogs(90);

      this.logger.log(
        `Cleanup job completed. Deleted ${deletedLogsCount} old logs`,
      );
    } catch (error) {
      this.logger.error("Cleanup job failed:", error);
      await this.logService.error("Cleanup job failed", {
        error: error.message,
      });
    }
  }

  // 每周一早上发送周报
  @Cron(CronExpression.EVERY_WEEKEND)
  async sendWeeklyReport() {
    try {
      this.logger.log("Running weekly report job...");

      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const timeRange = {
        startDate: lastWeek,
        endDate: today,
      };

      // 获取周统计数据
      const weeklyStats =
        await this.statisticService.getDashboardStats(timeRange);

      // 获取管理员用户
      const admins = await this.prisma.user.findMany({
        where: { role: "admin" },
      });

      // 发送周报到每个管理员
      for (const admin of admins) {
        await this.notificationService.sendTemplateNotification(
          "weekly_report",
          {
            title: "周报",
            content: `本周统计报告：\n新增用户: ${weeklyStats.newUsersToday}\n新增订单: ${weeklyStats.ordersToday}\n销售额: ¥${weeklyStats.revenueToday.toFixed(2)}\n转化率: ${weeklyStats.conversionRate.toFixed(2)}%`,
          },
          admin.user_id,
        );
      }

      this.logger.log("Weekly report job completed successfully");
    } catch (error) {
      this.logger.error("Weekly report job failed:", error);
      await this.logService.error("Weekly report job failed", {
        error: error.message,
      });
    }
  }

  // 每天检查库存警告
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkInventoryWarnings() {
    try {
      this.logger.log("Running inventory warning check job...");

      // 获取低库存产品
      const lowStockProducts = await this.prisma.product.findMany({
        where: {
          stock: {
            lte: 10, // 库存小于10
          },
          is_enabled: true,
        },
        include: {
          category: true,
        },
      });

      if (lowStockProducts.length > 0) {
        // 获取产品管理员
        const productManagers = await this.prisma.user.findMany({
          where: { role: "product_manager" },
        });

        // 发送库存警告通知
        for (const manager of productManagers) {
          await this.notificationService.sendTemplateNotification(
            "low_stock_warning",
            {
              title: "库存警告",
              content: `有 ${lowStockProducts.length} 个产品库存不足，请及时补货`,
              relatedData: {
                products: lowStockProducts.map((p) => ({
                  id: p.product_id,
                  name: p.product_name,
                  stock: p.stock,
                })),
              },
            },
            manager.user_id,
          );
        }
      }

      this.logger.log(
        `Inventory warning check completed. Found ${lowStockProducts.length} low stock products`,
      );
    } catch (error) {
      this.logger.error("Inventory warning check job failed:", error);
      await this.logService.error("Inventory warning check job failed", {
        error: error.message,
      });
    }
  }

  // 每30分钟检查系统健康状态
  @Cron("*/30 * * * *")
  async healthCheck() {
    try {
      this.logger.log("Running health check job...");

      // 检查数据库连接
      await this.prisma.$queryRaw`SELECT 1`;

      // 检查Redis连接
      await this.redisService.get("health_check");

      // 检查系统资源
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      // 记录健康状态
      await this.logService.info("System health check passed", {
        memoryUsage: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
        },
        uptime,
      });

      this.logger.log("Health check job completed successfully");
    } catch (error) {
      this.logger.error("Health check job failed:", error);
      await this.logService.error("Health check job failed", {
        error: error.message,
      });
    }
  }

  // 私有方法实现
  private async warmupPopularProductsCache(): Promise<void> {
    const popularProducts = await this.prisma.product.findMany({
      where: { is_enabled: true },
      include: {
        category: true,
        brand: true,
      },
      orderBy: { sales_count: "desc" },
      take: 50,
    });

    // 缓存热门产品
    await this.redisService.set("popular_products", popularProducts, {
      ttl: 3600,
    });
  }

  private async warmupCategoriesCache(): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: { is_enabled: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    await this.redisService.set("categories", categories, { ttl: 3600 });
  }

  private async warmupBrandsCache(): Promise<void> {
    const brands = await this.prisma.brand.findMany({
      where: { is_enabled: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    await this.redisService.set("brands", brands, { ttl: 3600 });
  }

  private async checkTimeoutOrders(): Promise<void> {
    const timeout = 30 * 60 * 1000; // 30分钟
    const timeoutDate = new Date(Date.now() - timeout);

    const timeoutOrders = await this.prisma.order.findMany({
      where: {
        order_status: "pending",
        pay_status: "unpaid",
        created_at: {
          lte: timeoutDate,
        },
      },
    });

    for (const order of timeoutOrders) {
      await this.prisma.order.update({
        where: { order_id: order.order_id },
        data: { order_status: "cancelled" },
      });

      // 发送订单取消通知
      await this.notificationService.sendTemplateNotification(
        "order_timeout",
        {
          title: "订单已取消",
          content: `订单 #${order.order_sn} 因超时未支付已被自动取消`,
        },
        order.user_id,
      );
    }
  }

  private async checkAutoConfirmOrders(): Promise<void> {
    const autoConfirmDays = 7; // 7天后自动确认收货
    const autoConfirmDate = new Date(
      Date.now() - autoConfirmDays * 24 * 60 * 60 * 1000,
    );

    const autoConfirmOrders = await this.prisma.order.findMany({
      where: {
        order_status: "shipped",
        shipping_time: {
          lte: autoConfirmDate,
        },
      },
    });

    for (const order of autoConfirmOrders) {
      await this.prisma.order.update({
        where: { order_id: order.order_id },
        data: { order_status: "completed", confirm_time: new Date() },
      });

      // 发送自动确认收货通知
      await this.notificationService.sendTemplateNotification(
        "order_auto_confirm",
        {
          title: "订单已自动确认收货",
          content: `订单 #${order.order_sn} 已自动确认收货`,
        },
        order.user_id,
      );
    }
  }

  private async checkOrderReminders(): Promise<void> {
    const reminderHours = 24; // 24小时后提醒
    const reminderDate = new Date(Date.now() - reminderHours * 60 * 60 * 1000);

    const reminderOrders = await this.prisma.order.findMany({
      where: {
        order_status: "paid",
        shipping_status: "unshipped",
        pay_time: {
          lte: reminderDate,
        },
      },
    });

    for (const order of reminderOrders) {
      // 发送发货提醒通知
      await this.notificationService.sendTemplateNotification(
        "order_shipping_reminder",
        {
          title: "订单发货提醒",
          content: `订单 #${order.order_sn} 等待发货中，请及时处理`,
        },
        order.user_id,
      );
    }
  }

  private async cleanupExpiredVerificationCodes(): Promise<void> {
    const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时后过期

    await this.prisma.verificationCode.deleteMany({
      where: {
        created_at: {
          lte: expiredTime,
        },
        is_used: false,
      },
    });
  }

  private async cleanupExpiredTokens(): Promise<void> {
    const expiredTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7天后过期

    await this.prisma.refreshToken.deleteMany({
      where: {
        expires_at: {
          lte: expiredTime,
        },
      },
    });
  }

  private async cleanupExpiredCache(): Promise<void> {
    await this.redisService.clearPattern("verification_code:*");
    await this.redisService.clearPattern("password_reset:*");
  }

  // 手动触发任务
  async triggerJob(
    jobName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (jobName) {
        case "dailyStatistics":
          await this.dailyStatistics();
          break;
        case "cacheWarmup":
          await this.cacheWarmup();
          break;
        case "checkOrderStatus":
          await this.checkOrderStatus();
          break;
        case "cleanupExpiredData":
          await this.cleanupExpiredData();
          break;
        case "sendWeeklyReport":
          await this.sendWeeklyReport();
          break;
        case "checkInventoryWarnings":
          await this.checkInventoryWarnings();
          break;
        case "healthCheck":
          await this.healthCheck();
          break;
        default:
          throw new Error(`Unknown job: ${jobName}`);
      }

      return { success: true, message: `Job ${jobName} executed successfully` };
    } catch (error) {
      return {
        success: false,
        message: `Job ${jobName} failed: ${error.message}`,
      };
    }
  }

  // 获取任务状态
  async getJobStatus(): Promise<any> {
    // 这里可以实现更复杂的任务状态跟踪
    return {
      jobs: [
        { name: "dailyStatistics", status: "idle", lastRun: null },
        { name: "cacheWarmup", status: "idle", lastRun: null },
        { name: "checkOrderStatus", status: "idle", lastRun: null },
        { name: "cleanupExpiredData", status: "idle", lastRun: null },
        { name: "sendWeeklyReport", status: "idle", lastRun: null },
        { name: "checkInventoryWarnings", status: "idle", lastRun: null },
        { name: "healthCheck", status: "idle", lastRun: null },
      ],
    };
  }
}
