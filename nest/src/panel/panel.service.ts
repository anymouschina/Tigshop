// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PanelService {
  constructor(private prisma: PrismaService) {}

  async getConsoleData(shopId: number) {
    const today = Math.floor(Date.now() / 1000);
    const yesterday = today - 86400;

    // 今日订单数
    const todayOrderCount = await this.prisma.order.count({
      where: {
        shop_id: shopId,
        create_time: {
          gte: today,
        },
      },
    });

    // 今日销售额
    const todaySalesResult = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        create_time: {
          gte: today,
        },
      },
      _sum: {
        order_amount: true,
      },
    });

    // 今日新增用户
    const todayNewUsers = await this.prisma.user.count({
      where: {
        create_time: {
          gte: today,
        },
      },
    });

    // 待处理订单
    const pendingOrders = await this.prisma.order.count({
      where: {
        shop_id: shopId,
        order_status: 0, // 待处理
      },
    });

    return {
      today_order_count: todayOrderCount,
      today_sales: todaySalesResult._sum.order_amount || 0,
      today_new_users: todayNewUsers,
      pending_orders: pendingOrders,
    };
  }

  async getRealTimeData(shopId: number) {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    // 最近1小时访问量
    const recentVisits = await this.prisma.access_log.count({
      where: {
        shop_id: shopId,
        access_time: {
          gte: oneHourAgo,
        },
      },
    });

    // 最近1小时订单数
    const recentOrders = await this.prisma.order.count({
      where: {
        shop_id: shopId,
        create_time: {
          gte: oneHourAgo,
        },
      },
    });

    // 在线用户数（最近30分钟有活动）
    const thirtyMinutesAgo = now - 1800;
    const onlineUsers = await this.prisma.user.count({
      where: {
        last_login_time: {
          gte: thirtyMinutesAgo,
        },
      },
    });

    return {
      recent_visits: recentVisits,
      recent_orders: recentOrders,
      online_users: onlineUsers,
    };
  }

  async getPanelStatisticalData(shopId: number) {
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 86400);
    const thirtyDaysAgo = now - (30 * 86400);

    // 近7天订单趋势
    const sevenDayOrders = await this.prisma.order.groupBy({
      by: ['create_time'],
      where: {
        shop_id: shopId,
        create_time: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        order_id: true,
      },
      _sum: {
        order_amount: true,
      },
    });

    // 近30天销售统计
    const thirtyDaySales = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        create_time: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        order_id: true,
      },
      _sum: {
        order_amount: true,
      },
    });

    // 商品销售排行
    const topProducts = await this.prisma.order_item.groupBy({
      by: ['product_id'],
      where: {
        order: {
          shop_id: shopId,
        },
      },
      _sum: {
        product_num: true,
      },
      orderBy: {
        _sum: {
          product_num: 'desc',
        },
      },
      take: 10,
    });

    return {
      seven_day_orders: sevenDayOrders,
      thirty_day_stats: thirtyDaySales,
      top_products: topProducts,
    };
  }

  async getPanelVendorIndex(vendorId: number) {
    const now = Math.floor(Date.now() / 1000);
    const today = now - (now % 86400);

    // 供应商今日订单
    const todayOrders = await this.prisma.order.count({
      where: {
        vendor_id: vendorId,
        create_time: {
          gte: today,
        },
      },
    });

    // 供应商今日销售额
    const todaySalesResult = await this.prisma.order.aggregate({
      where: {
        vendor_id: vendorId,
        create_time: {
          gte: today,
        },
      },
      _sum: {
        order_amount: true,
      },
    });

    // 供应商商品数量
    const productCount = await this.prisma.vendor_product.count({
      where: {
        vendor_id: vendorId,
        is_delete: 0,
      },
    });

    // 待审核商品
    const pendingProducts = await this.prisma.vendor_product.count({
      where: {
        vendor_id: vendorId,
        audit_status: 0, // 待审核
      },
    });

    return {
      today_orders: todayOrders,
      today_sales: todaySalesResult._sum.order_amount || 0,
      product_count: productCount,
      pending_products: pendingProducts,
    };
  }
}
