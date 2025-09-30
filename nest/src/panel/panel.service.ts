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
   * 获取用户的供应商ID（vendorId / suppliers_id）
   * @param userId 管理员ID
   * @returns vendorId（无则返回 0）
   */
  async getUserVendorId(userId: number): Promise<number> {
    const adminUser = await this.prisma.admin_user.findUnique({
      where: { admin_id: userId },
      select: { suppliers_id: true },
    });
    return adminUser?.suppliers_id || 0;
  }

  /**
   * 获取用户的管理员类型（admin_type）
   * @param userId 管理员ID
   * @returns adminType（默认 1）
   */
  async getUserAdminType(userId: number): Promise<number> {
    const adminUser = await this.prisma.admin_user.findUnique({
      where: { admin_id: userId },
      select: { admin_type: true },
    });
    return adminUser?.admin_type ?? 1;
  }

  /**
   * 新增会员趋势
   * - dateType: "1" 年-按月, "2" 月-按日, "3" 日-按时
   * - startEndTime: 对应的起点值：YYYY | YYYY-MM | YYYY-MM-DD
   * 返回：{ horizontalAxis: string[] | number[], longitudinalAxis: number[] }
   */
  async getAddUserTrends(
    dateType: string,
    startEndTime: string,
  ): Promise<{ horizontalAxis: Array<string | number>; longitudinalAxis: number[] }> {
    const dt = String(dateType);
    if (!startEndTime) throw new Error("请选择日期");

    // 计算时间范围与横轴
    let start: Date, end: Date;
    let horizontalAxis: Array<string | number> = [];

    if (dt === "1") {
      // 年：YYYY -> 本年1月1日至12月31日（若当年则到当前月）
      const year = Number(startEndTime);
      if (!Number.isFinite(year)) throw new Error("年份格式不正确");
      start = new Date(year, 0, 1, 0, 0, 0, 0);
      // 结束到该年最后一天 23:59:59
      end = new Date(year, 11, 31, 23, 59, 59, 999);
      const isCurrentYear = year === new Date().getFullYear();
      const monthCount = isCurrentYear ? new Date().getMonth() + 1 : 12;
      for (let m = 1; m <= monthCount; m++) horizontalAxis.push(String(m).padStart(2, "0"));
    } else if (dt === "2") {
      // 月：YYYY-MM -> 当月1日至当月最后一天
      const [yStr, mStr] = startEndTime.split("-");
      const y = Number(yStr);
      const m = Number(mStr) - 1; // JS 月份 0-11
      if (!Number.isFinite(y) || !Number.isFinite(m) || m < 0 || m > 11) throw new Error("月份格式不正确");
      start = new Date(y, m, 1, 0, 0, 0, 0);
      // 当月天数
      const lastDay = new Date(y, m + 1, 0).getDate();
      end = new Date(y, m, lastDay, 23, 59, 59, 999);
      for (let d = 1; d <= lastDay; d++) horizontalAxis.push(d);
    } else if (dt === "3") {
      // 日：YYYY-MM-DD -> 当天 0:00:00 - 23:59:59
      const d = new Date(startEndTime);
      if (Number.isNaN(d.getTime())) throw new Error("日期格式不正确");
      start = this.startOfDay(d);
      end = this.endOfDay(d);
      for (let h = 0; h < 24; h++) horizontalAxis.push(h);
    } else {
      // 默认按天自定义区间：这里沿用简单策略，作为兜底
      const d = new Date(startEndTime);
      if (Number.isNaN(d.getTime())) throw new Error("日期格式不正确");
      start = this.startOfDay(d);
      end = this.endOfDay(d);
      horizontalAxis = [startEndTime];
    }

    const tsStart = Math.floor(start.getTime() / 1000);
    const tsEnd = Math.floor(end.getTime() / 1000);

    // 查询该时间范围内的用户注册记录（只需 reg_time）
    const users = await this.prisma.user.findMany({
      where: {
        reg_time: {
          gte: tsStart,
          lte: tsEnd,
        },
      },
      select: { reg_time: true },
    });

    // 归档到桶
    const buckets = new Map<string, number>();
    // 初始化所有桶为0
    for (const label of horizontalAxis) buckets.set(String(label).padStart(2, "0"), 0);

    for (const u of users) {
      const regDate = new Date((u.reg_time ?? 0) * 1000);
      let key: string;
      if (dt === "1") {
        // 月份 01..12（或至当前月）
        key = String(regDate.getMonth() + 1).padStart(2, "0");
      } else if (dt === "2") {
        // 日期 01..31
        key = String(regDate.getDate()).padStart(2, "0");
      } else if (dt === "3") {
        // 小时 00..23
        key = String(regDate.getHours()).padStart(2, "0");
      } else {
        key = new Date(regDate).toISOString().split("T")[0];
      }
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    // 输出纵轴（按照横轴顺序映射）
    const longitudinalAxis = horizontalAxis.map((label) => buckets.get(String(label).padStart(2, "0")) ?? 0);

    return { horizontalAxis, longitudinalAxis };
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

  /**
   * 访问统计（点击量/访客数）
   * 与 PHP 的 StatisticsAccessService::getAccessStatistics 行为对齐
   * 返回：{ horizontalAxis: string[], longitudinalAxis: number[] }
   */
  async getAccessStatistics(
    shopId: number,
    startTime: string,
    endTime: string,
    isHits: number, // 1=点击量(click_count)，0=访客数(visitor_count)
  ): Promise<{ horizontalAxis: string[]; longitudinalAxis: number[] }> {
    if (!startTime || !endTime) {
      throw new Error("请选择日期");
    }

    // 规范化日期并生成横轴（按天）
    const start = this.startOfDay(new Date(startTime));
    const end = this.endOfDay(new Date(endTime));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("日期格式不正确");
    }

    const days = Math.floor((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
    const horizontalAxis: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 3600 * 1000);
      horizontalAxis.push(d.toISOString().split("T")[0]);
    }

    // 从 statistics_base 取区间内的每日累计数据
    const rows = await this.prisma.statistics_base.findMany({
      where: {
        date: { gte: start, lte: end },
        shop_id: shopId > 0 ? shopId : 0,
      },
      select: {
        date: true,
        click_count: true,
        visitor_count: true,
      },
      orderBy: { date: "asc" },
    });

    const dataMap = new Map<string, number>();
    for (const r of rows) {
      if (!r.date) continue;
      const key = new Date(r.date).toISOString().split("T")[0];
      const val = isHits ? Number(r.click_count ?? 0) : Number(r.visitor_count ?? 0);
      dataMap.set(key, val);
    }

    const longitudinalAxis = horizontalAxis.map((d) => dataMap.get(d) ?? 0);

    return { horizontalAxis, longitudinalAxis };
  }

  /**
   * 会员消费排行
   * 与 PHP StatisticsUserService::getUserConsumptionRanking 对齐
   */
  async getUserConsumptionRanking(
    shopId: number,
    params: {
      startTime?: string;
      endTime?: string;
      keyword?: string;
      page: number;
      size: number;
      sortField?: string;
      sortOrder?: string;
      isExport?: string;
    },
  ): Promise<{ records: Array<{ username: string; mobile: string; orderNum: number; orderAmount: string }>; total: number } | any> {
    const start = params.startTime ? this.startOfDay(new Date(params.startTime)) : null;
    const end = params.endTime ? this.endOfDay(new Date(params.endTime)) : null;
    const tsStart = start ? Math.floor(start.getTime() / 1000) : undefined;
    const tsEnd = end ? Math.floor(end.getTime() / 1000) : undefined;

    // 基础 where 条件：已支付订单、未删除、shop 过滤、时间范围
    const where: any = {
      is_del: 0,
      pay_status: 2, // PAYMENT_PAID
      ...(shopId > 0 ? { shop_id: shopId } : {}),
      ...(tsStart !== undefined && tsEnd !== undefined
        ? { add_time: { gte: tsStart, lte: tsEnd } }
        : {}),
    };

    // 关键字过滤（用户名或手机号）
    // 需要 left join user；Prisma不直接支持 left join 聚合到 user 表字段筛选，采用两步：
    // 1) 找到满足关键字的用户ID集合；2) 在订单筛选中限制 user_id in []
    let userIdFilter: number[] | undefined = undefined;
    if (params.keyword && params.keyword.trim()) {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: params.keyword } },
            { mobile: { contains: params.keyword } },
          ],
        },
        select: { user_id: true },
      });
      userIdFilter = users.map((u) => u.user_id);
      if (userIdFilter.length === 0) {
        return { records: [], total: 0 };
      }
      where.user_id = { in: userIdFilter };
    }

    // 通过原生 SQL 实现 group by user_id，统计订单数与金额，并关联 user 表取用户名与手机
    // 注意：order 为保留字，使用反引号；金额求和为 decimal，转换为字符串输出以匹配前端类型
    const sortField = params.sortField === "orderNum" ? "order_num" : "order_amount"; // 默认按金额
    const sortOrder = params.sortOrder?.toLowerCase() === "asc" ? "ASC" : "DESC";
    const offset = Math.max((params.page - 1) * params.size, 0);
    const limit = Math.max(params.size, 1);

    // 拼接可选 user_id in 过滤
    const userIdInClause = userIdFilter && userIdFilter.length > 0
      ? this.prisma.$queryRawUnsafe(
          userIdFilter.map(() => "?").join(","),
        )
      : null;

    // 由于 $queryRaw 安全性与可读性，构建 where 的动态片段
    const conditions: string[] = [
      "o.is_del = 0",
      "o.pay_status = 2",
    ];
    const paramsArr: any[] = [];
    if (shopId > 0) {
      conditions.push("o.shop_id = ?");
      paramsArr.push(shopId);
    }
    if (tsStart !== undefined && tsEnd !== undefined) {
      conditions.push("o.add_time BETWEEN ? AND ?");
      paramsArr.push(tsStart, tsEnd);
    }
    if (userIdFilter && userIdFilter.length) {
      conditions.push(`o.user_id IN (${userIdFilter.map(() => "?").join(",")})`);
      paramsArr.push(...userIdFilter);
    }
    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // 统计总数（按用户分组后的行数）
    const countSql = `
      SELECT COUNT(*) AS total FROM (
        SELECT o.user_id
        FROM \`order\` o
        ${whereSql}
        GROUP BY o.user_id
      ) t
    `;
    const countRes = (await this.prisma.$queryRawUnsafe(countSql, ...paramsArr)) as Array<{ total: bigint }>;
    const total = Number(countRes?.[0]?.total ?? 0);

    // 查询分页数据
    const dataSql = `
      SELECT u.username, u.mobile,
             COUNT(o.order_id) AS order_num,
             SUM(o.total_amount) AS order_amount
      FROM \`order\` o
      LEFT JOIN user u ON u.user_id = o.user_id
      ${whereSql}
      GROUP BY o.user_id
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...paramsArr, limit, offset];
    const rows = (await this.prisma.$queryRawUnsafe(dataSql, ...dataParams)) as Array<{
      username: string | null;
      mobile: string | null;
      order_num: bigint | number;
      order_amount: any;
    }>;

    const records = (rows || []).map((r) => ({
      username: r.username || "",
      mobile: r.mobile || "",
      orderNum: Number(r.order_num || 0),
      orderAmount: (typeof r.order_amount === "number" ? r.order_amount : Number(r.order_amount || 0)).toFixed(2),
    }));

    // 导出占位（前端使用同一路径 isExport=1 下载二进制）
    if (params.isExport === "1") {
      // 简单导出 CSV 内容（用户名,手机号,订单数,消费总额）
      const header = "用户名,手机号,订单数,消费总额\n";
      const csvBody = records
        .map((r) => `${r.username},${r.mobile},${r.orderNum},${r.orderAmount}`)
        .join("\n");
      const csv = header + csvBody;
      // 返回 Buffer，由控制器透传给前端
      return Buffer.from(csv, "utf8");
    }

    return { records, total };
  }
}
