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
  async validateUserAndGetShopId(
    req: any,
  ): Promise<{ userId: number; shopId: number } | null> {
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
      .findMany({
        where: {
          shop_id: shopId,
          pay_time: {
            gte: todayStart,
          },
          pay_status: 1, // PAYMENT_PAID
        },
        select: {
          user_id: true,
        },
        distinct: ["user_id"],
      })
      .then((result) => (Array.isArray(result) ? result.length : 0));

    // 昨日支付买家数
    const yesterdayBuyerNum = await this.prisma.order
      .findMany({
        where: {
          shop_id: shopId,
          pay_time: {
            gte: yesterdayStart,
            lt: todayStart,
          },
          pay_status: 1, // PAYMENT_PAID
        },
        select: {
          user_id: true,
        },
        distinct: ["user_id"],
      })
      .then((result) => (Array.isArray(result) ? result.length : 0));

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

    // 获取访问统计 - 使用 findMany 替代 groupBy
    const accessLogs = await this.prisma.access_log.findMany({
      where: {
        shop_id: shopId,
        access_time: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        access_time: true,
        id: true,
      },
    });

    // 手动按日期分组统计
    const accessDataMap = new Map();
    accessLogs.forEach((log) => {
      const date = new Date(log.access_time * 1000).toISOString().split("T")[0];
      if (!accessDataMap.has(date)) {
        accessDataMap.set(date, {
          access_time: log.access_time,
          _count: { id: 0 },
        });
      }
      accessDataMap.get(date)._count.id++;
    });

    const accessData = Array.from(accessDataMap.values());

    // 获取订单统计
    const orderData =
      ((await this.prisma.$queryRaw`
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
    `) as Array<{
        period: string;
        order_count: bigint;
        order_amount: number;
      }>) || [];

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
    // 直接获取shopId，因为有全局鉴权保证用户已登录
    const shopId = await this.getUserShopId(req.user.userId);

    // 动态导入SalesStatisticsService以避免循环依赖
    const { SalesStatisticsService } = await import(
      "../statistics/sales-statistics.service"
    );
    const salesStatisticsService = new SalesStatisticsService(this.prisma);

    // 调用SalesStatisticsService获取销售指标数据
    return await salesStatisticsService.getSalesIndicators(shopId);
  }

  /**
   * 用户统计面板数据
   * - 访客数/浏览量：来自 statistics_base 区间聚合（访客=visitor_count，浏览量=click_count），按 shop_id 过滤
   * - 新增用户数：user.reg_time 落在区间内
   * - 成交用户数：区间内已支付订单的去重 user_id 数，按 shop_id 过滤
   * - 充值用户数：user_recharge_order 在区间内且 status=1 的去重 user_id 数
   * - 转化率与各项环比：对比上一等长时间区间
   */
  async getUserStatisticsPanel(
    shopId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    visitNum: number | string;
    visitGrowthRate: number | string;
    viewNum: number;
    viewGrowthRate: number | string;
    addUserNum: number;
    addUserGrowthRate: number | string;
    dealUserNum: number;
    dealUserGrowthRate: number | string;
    visitToUser: number;
    visitToUserRate: number | string;
    rechargeUserNum: number;
    rechargeUserGrowthRate: number | string;
  }> {
    // 规范化日期区间（默认最近30天）
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 29 * 24 * 3600 * 1000);
    const sDate = startDate ? new Date(startDate) : defaultStart;
    const eDate = endDate ? new Date(endDate) : today;

    // 对齐到天
    const start = this.startOfDay(sDate);
    const end = this.endOfDay(eDate);

    // 上一等长区间
    const rangeMs = Math.max(end.getTime() - start.getTime(), 0);
    const prevEnd = new Date(start.getTime() - 1000);
    const prevStart = new Date(prevEnd.getTime() - rangeMs);

    // Prisma用：statistics_base 使用 Date 列 date；其他表使用 Unix 秒
    const dateStart = start; // Date
    const dateEnd = end; // Date
    const tsStart = Math.floor(start.getTime() / 1000);
    const tsEnd = Math.floor(end.getTime() / 1000);
    const prevDateStart = this.startOfDay(prevStart);
    const prevDateEnd = this.endOfDay(prevEnd);
    const prevTsStart = Math.floor(prevDateStart.getTime() / 1000);
    const prevTsEnd = Math.floor(prevDateEnd.getTime() / 1000);

    // 辅助：环比增长率，若任一为0则返回"--"以对齐旧版前端预期
    const growth = (cur: number, prev: number): number | string => {
      if (!cur || !prev) return "--";
      const rate = ((cur - prev) / prev) * 100;
      return Number(rate.toFixed(2));
    };

    // 访客/浏览量来自 statistics_base
    const [curStatsBase, prevStatsBase] = await Promise.all([
      this.prisma.statistics_base.aggregate({
        where: {
          date: {
            gte: dateStart,
            lte: dateEnd,
          },
          shop_id: shopId > 0 ? shopId : 0,
        },
        _sum: { visitor_count: true, click_count: true },
      }),
      this.prisma.statistics_base.aggregate({
        where: {
          date: {
            gte: prevDateStart,
            lte: prevDateEnd,
          },
          shop_id: shopId > 0 ? shopId : 0,
        },
        _sum: { visitor_count: true, click_count: true },
      }),
    ]);

    const visitNum = Number(curStatsBase._sum.visitor_count ?? 0);
    const prevVisitNum = Number(prevStatsBase._sum.visitor_count ?? 0);
    const viewNum = Number(curStatsBase._sum.click_count ?? 0);
    const prevViewNum = Number(prevStatsBase._sum.click_count ?? 0);

    // 新增用户数
    const [addUserNum, prevAddUserNum] = await Promise.all([
      this.prisma.user.count({
        where: {
          reg_time: { gte: tsStart, lte: tsEnd },
        },
      }),
      this.prisma.user.count({
        where: {
          reg_time: { gte: prevTsStart, lte: prevTsEnd },
        },
      }),
    ]);

    // 成交用户数（已支付订单去重用户）
    const [dealUserNum, prevDealUserNum] = await Promise.all([
      this.prisma.order
        .findMany({
          where: {
            is_del: 0,
            pay_status: 2, // PAYMENT_PAID (align with sales stats service)
            pay_time: { gte: tsStart, lte: tsEnd },
            ...(shopId > 0 ? { shop_id: shopId } : {}),
          },
          select: { user_id: true },
          distinct: ["user_id"],
        })
        .then((arr) => arr.length),
      this.prisma.order
        .findMany({
          where: {
            is_del: 0,
            pay_status: 2,
            pay_time: { gte: prevTsStart, lte: prevTsEnd },
            ...(shopId > 0 ? { shop_id: shopId } : {}),
          },
          select: { user_id: true },
          distinct: ["user_id"],
        })
        .then((arr) => arr.length),
    ]);

    // 充值用户数（已支付/成功的充值订单去重用户）
    const [rechargeUserNum, prevRechargeUserNum] = await Promise.all([
      this.prisma.user_recharge_order
        .findMany({
          where: {
            status: true, // STATUS_SUCCESS
            paid_time: { gte: tsStart, lte: tsEnd },
          },
          select: { user_id: true },
          distinct: ["user_id"],
        })
        .then((arr) => arr.length),
      this.prisma.user_recharge_order
        .findMany({
          where: {
            status: true,
            paid_time: { gte: prevTsStart, lte: prevTsEnd },
          },
          select: { user_id: true },
          distinct: ["user_id"],
        })
        .then((arr) => arr.length),
    ]);

    // 转化率（访客-支付转化率：新增用户数/访客数*100）
    const visitToUser = visitNum > 0 && addUserNum > 0 ? Number(((addUserNum / visitNum) * 100).toFixed(2)) : 0;
    const prevVisitToUser = prevVisitNum > 0 && prevAddUserNum > 0 ? Number(((prevAddUserNum / prevVisitNum) * 100).toFixed(2)) : 0;

    return {
      visitNum, // 前端类型允许 number|string
      visitGrowthRate: growth(visitNum, prevVisitNum),
      viewNum,
      viewGrowthRate: growth(viewNum, prevViewNum),
      addUserNum,
      addUserGrowthRate: growth(addUserNum, prevAddUserNum),
      dealUserNum,
      dealUserGrowthRate: growth(dealUserNum, prevDealUserNum),
      visitToUser,
      visitToUserRate: growth(visitToUser, prevVisitToUser),
      rechargeUserNum,
      rechargeUserGrowthRate: growth(rechargeUserNum, prevRechargeUserNum),
    };
  }

  private startOfDay(d: Date): Date {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  }

  private endOfDay(d: Date): Date {
    const nd = new Date(d);
    nd.setHours(23, 59, 59, 999);
    return nd;
  }
}
