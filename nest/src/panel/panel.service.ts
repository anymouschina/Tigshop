// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PanelService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户的shopId
   * @param userId 用户ID
   * @returns shopId
   */
  async getUserShopId(userId: number): Promise<number> {
    // 这里应该通过AuthorityService获取用户信息，但为了避免循环依赖，
    // 我们暂时直接使用Prisma查询
    const adminUser = await this.prisma.admin_user.findUnique({
      where: { admin_id: userId },
      select: { shop_id: true },
    });

    return adminUser?.shop_id || 1;
  }

  /**
   * 验证用户是否登录并获取shopId
   * @param req 请求对象
   * @returns { userId: number, shopId: number } | null
   */
  async validateUserAndGetShopId(req: any): Promise<{ userId: number; shopId: number } | null> {
    const userId = req.user?.userId;
    if (!userId) {
      return null;
    }

    const shopId = await this.getUserShopId(userId);
    return { userId, shopId };
  }

  async getConsoleData(shopId: number) {
    // 待付款订单 (order_status = 0)
    const awaitPay = await this.prisma.order.count({
      where: {
        shop_id: shopId,
        order_status: 0, // ORDER_PENDING
      },
    });

    // 待发货订单 (order_status = 1)
    const awaitShip = await this.prisma.order.count({
      where: {
        shop_id: shopId,
        order_status: 1, // ORDER_CONFIRMED
      },
    });

    // 待售后订单 (order_status in [1,2,3])
    const awaitAfterSale = await this.prisma.order.count({
      where: {
        shop_id: shopId,
        order_status: {
          in: [1, 2, 3], // ORDER_CONFIRMED, ORDER_PROCESSING, ORDER_COMPLETED
        },
      },
    });

    // 待回复留言 (status = 0, parent_id = 0, type in [1,2])
    const awaitComment = await this.prisma.feedback.count({
      where: {
        shop_id: shopId,
        status: 0,
        parent_id: 0,
        type: {
          in: [1, 2], // TYPE_ORDER_PROBLEM, TYPE_ORDER_ASK
        },
      },
    });

    return {
      awaitPay: awaitPay,
      awaitShip: awaitShip,
      awaitAfterSale: awaitAfterSale,
      awaitComment: awaitComment,
    };
  }

  async getRealTimeData(shopId: number) {
    const now = Math.floor(Date.now() / 1000);
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const yesterdayStart = todayStart - 86400;

    // 计算增长率的辅助函数
    const calculateGrowthRate = (today: number, yesterday: number): number => {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return Number((((today - yesterday) / yesterday) * 100).toFixed(4));
    };

    // 今日支付金额
    const todayOrderAmountResult = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        pay_time: {
          gte: todayStart,
        },
        pay_status: 1, // PAYMENT_PAID
      },
      _sum: {
        total_amount: true,
      },
    });

    // 昨日支付金额
    const yesterdayOrderAmountResult = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        pay_time: {
          gte: yesterdayStart,
          lt: todayStart,
        },
        pay_status: 1, // PAYMENT_PAID
      },
      _sum: {
        total_amount: true,
      },
    });

    const todayOrderAmount = todayOrderAmountResult._sum.total_amount || 0;
    const yesterdayOrderAmount =
      yesterdayOrderAmountResult._sum.total_amount || 0;
    const orderAmountGrowthRate = calculateGrowthRate(
      Number(todayOrderAmount),
      Number(yesterdayOrderAmount),
    );

    // 今日访客数
    const todayVisitNum = await this.prisma.access_log.count({
      where: {
        shop_id: shopId,
        access_time: {
          gte: todayStart,
        },
      },
    });

    // 昨日访客数
    const yesterdayVisitNum = await this.prisma.access_log.count({
      where: {
        shop_id: shopId,
        access_time: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
    });

    const visitGrowthRate = calculateGrowthRate(
      todayVisitNum,
      yesterdayVisitNum,
    );

    // 今日支付买家数
    const todayBuyerNum = await this.prisma.order
      .groupBy({
        by: ["user_id"],
        where: {
          shop_id: shopId,
          pay_time: {
            gte: todayStart,
          },
          pay_status: 1, // PAYMENT_PAID
        },
      })
      .then((result) => result.length);

    // 昨日支付买家数
    const yesterdayBuyerNum = await this.prisma.order
      .groupBy({
        by: ["user_id"],
        where: {
          shop_id: shopId,
          pay_time: {
            gte: yesterdayStart,
            lt: todayStart,
          },
          pay_status: 1, // PAYMENT_PAID
        },
      })
      .then((result) => result.length);

    const buyerGrowthRate = calculateGrowthRate(
      todayBuyerNum,
      yesterdayBuyerNum,
    );

    // 今日浏览量
    const todayViewNum = await this.prisma.access_log.count({
      where: {
        shop_id: shopId,
        access_time: {
          gte: todayStart,
        },
      },
    });

    // 昨日浏览量
    const yesterdayViewNum = await this.prisma.access_log.count({
      where: {
        shop_id: shopId,
        access_time: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
    });

    const viewGrowthRate = calculateGrowthRate(todayViewNum, yesterdayViewNum);

    // 今日订单数
    const todayOrderNum = await this.prisma.order.count({
      where: {
        shop_id: shopId,
        pay_time: {
          gte: todayStart,
        },
        pay_status: 1, // PAYMENT_PAID
      },
    });

    // 昨日订单数
    const yesterdayOrderNum = await this.prisma.order.count({
      where: {
        shop_id: shopId,
        pay_time: {
          gte: yesterdayStart,
          lt: todayStart,
        },
        pay_status: 1, // PAYMENT_PAID
      },
    });

    const orderGrowthRate = calculateGrowthRate(
      todayOrderNum,
      yesterdayOrderNum,
    );

    return {
      todayOrderAmount: Number(todayOrderAmount),
      yesterdayOrderAmount: Number(yesterdayOrderAmount),
      orderAmountGrowthRate: orderAmountGrowthRate,
      todayVisitNum: todayVisitNum,
      yesterdayVisitNum: yesterdayVisitNum,
      visitGrowthRate: visitGrowthRate,
      todayBuyerNum: todayBuyerNum,
      yesterdayBuyerNum: yesterdayBuyerNum,
      buyerGrowthRate: buyerGrowthRate,
      todayViewNum: todayViewNum,
      yesterdayViewNum: yesterdayViewNum,
      viewGrowthRate: viewGrowthRate,
      todayOrderNum: todayOrderNum,
      yesterdayOrderNum: yesterdayOrderNum,
      orderGrowthRate: orderGrowthRate,
    };
  }

  async getPanelStatisticalData(shopId: number) {
    // 获取30天前的时间
    const thirtyDaysAgo = Math.floor(
      (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000,
    );

    // 生成横轴日期列表（最近30天）
    const horizontalAxis = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      horizontalAxis.push(date.toISOString().split("T")[0]); // YYYY-MM-DD格式
    }

    // 获取访问统计
    const accessData = await this.prisma.access_log.groupBy({
      by: ["access_time"],
      where: {
        shop_id: shopId,
        access_time: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // 获取订单统计
    const orderData = (await this.prisma.$queryRaw`
      SELECT
        DATE(FROM_UNIXTIME(pay_time)) as period,
        COUNT(*) as order_count,
        SUM(total_amount) as order_amount
      FROM \`order\`
      WHERE
        shop_id = ${shopId}
        AND pay_time >= ${thirtyDaysAgo}
        AND pay_status = 1
      GROUP BY DATE(FROM_UNIXTIME(pay_time))
      ORDER BY period
    `) as Array<{ period: string; order_count: bigint; order_amount: number }>;

    // 构建访问统计纵轴数据
    const longitudinalAxisAccess = horizontalAxis.map((date) => {
      const dayData = accessData.find((item) => {
        const itemDate = new Date(item.access_time * 1000)
          .toISOString()
          .split("T")[0];
        return itemDate === date;
      });
      return dayData ? Number(dayData._count.id) : 0;
    });

    // 构建订单数量纵轴数据
    const longitudinalAxisOrderNum = horizontalAxis.map((date) => {
      const dayData = orderData.find((item) => item.period === date);
      return dayData ? Number(dayData.order_count) : 0;
    });

    // 构建订单金额纵轴数据
    const longitudinalAxisOrderAmount = horizontalAxis.map((date) => {
      const dayData = orderData.find((item) => item.period === date);
      return dayData ? Number(dayData.order_amount) : 0;
    });

    return {
      horizontalAxis: horizontalAxis,
      longitudinalAxisAccess: longitudinalAxisAccess,
      longitudinalAxisOrderNum: longitudinalAxisOrderNum,
      longitudinalAxisOrderAmount: longitudinalAxisOrderAmount,
    };
  }

  async getPanelVendorIndex(vendorId: number) {
    const now = Math.floor(Date.now() / 1000);
    const today = now - (now % 86400);

    // 供应商今日订单
    const todayOrders = await this.prisma.order.count({
      where: {
        vendor_id: vendorId,
        add_time: {
          gte: today,
        },
      },
    });

    // 供应商今日销售额
    const todaySalesResult = await this.prisma.order.aggregate({
      where: {
        vendor_id: vendorId,
        add_time: {
          gte: today,
        },
      },
      _sum: {
        total_amount: true,
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
      today_sales: todaySalesResult._sum.total_amount || 0,
      product_count: productCount,
      pending_products: pendingProducts,
    };
  }

  /**
   * 获取销售指标数据
   * @param req 请求对象
   * @returns 销售指标数据
   */
  async getSalesIndicatorsData(req: any) {
    // 验证用户并获取shopId
    const userShopInfo = await this.validateUserAndGetShopId(req);
    if (!userShopInfo) {
      throw new Error('用户未登录');
    }

    const { shopId } = userShopInfo;

    // 这里应该调用SalesStatisticsService，但为了避免循环依赖，
    // 我们暂时直接实现逻辑，或者可以考虑通过其他方式注入SalesStatisticsService

    // 获取销售指标数据 - 按照PHP实现
    const [
      totalOrders,
      totalOrderProductsResult,
      totalOrderAmount,
      totalUsers,
      consumerUsers,
      clickCount,
    ] = await Promise.all([
      // 订单总数
      this.prisma.order.count({
        where: {
          shop_id: shopId,
          order_status: {
            in: [2, 3, 5], // ORDER_CONFIRMED, ORDER_PROCESSING, ORDER_COMPLETED
          },
        },
      }),
      // 订单商品总数 - 使用直接查询而不是关系
      this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM order_item oi
        JOIN "order" o ON oi.order_id = o.order_id
        WHERE
          o.shop_id = ${shopId}
          AND o.is_del = 0
          AND o.order_status IN (2, 3, 5)
          AND o.pay_status = 2
      ` as Array<{ count: number }>,
      // 订单总金额
      this.prisma.order.aggregate({
        where: {
          shop_id: shopId,
          order_status: {
            in: [2, 3, 5], // ORDER_CONFIRMED, ORDER_PROCESSING, ORDER_COMPLETED
          },
        },
        _sum: {
          total_amount: true,
        },
      }),
      // 会员总数
      this.prisma.user.count(),
      // 消费会员总数
      this.prisma.order.groupBy({
        by: ['user_id'],
        where: {
          shop_id: shopId,
          order_status: {
            in: [2, 3, 5], // ORDER_CONFIRMED, ORDER_PROCESSING, ORDER_COMPLETED
          },
        },
      }),
      // 访问数 -- 商品点击数
      this.prisma.product.aggregate({
        where: {
          shop_id: shopId,
          is_delete: 0,
        },
        _sum: {
          click_count: true,
        },
      }),
    ]);

    // 计算各种比率
    const userNum = totalUsers || 1; // 避免除零
    const orderNum = totalOrders || 0;
    const orderTotalAmount = totalOrderAmount._sum.total_amount || 0;
    const consumerMembershipNum = consumerUsers.length || 0;
    const clickCountValue = clickCount._sum.click_count || 0;
    const totalOrderProducts = totalOrderProductsResult?.[0]?.count || 0;

    // 人均消费数
    const capitaConsumption = userNum > 0 ? Number((orderTotalAmount / userNum).toFixed(2)) : 0;

    // 访问转化率
    const clickRate = clickCountValue > 0 ? Number(((orderNum / clickCountValue) * 100).toFixed(2)) : 0;

    // 订单转化率
    const orderRate = clickCountValue > 0 ? Number(((orderTotalAmount / clickCountValue) * 100).toFixed(2)) : 0;

    // 消费会员比率
    const consumerMembershipRate = userNum > 0 ? Number(((consumerMembershipNum / userNum) * 100).toFixed(2)) : 0;

    // 购买率
    const purchaseRate = userNum > 0 ? Number(((orderNum / userNum) * 100).toFixed(2)) : 0;

    return {
      order_num: orderNum,
      order_product_num: totalOrderProducts,
      order_total_amount: Number(orderTotalAmount.toFixed(2)),
      user_num: totalUsers,
      consumer_membership_num: consumerMembershipNum,
      capita_consumption: capitaConsumption,
      click_count: clickCountValue,
      click_rate: clickRate,
      order_rate: orderRate,
      consumer_membership_rate: consumerMembershipRate,
      purchase_rate: purchaseRate,
    };
  }
}
