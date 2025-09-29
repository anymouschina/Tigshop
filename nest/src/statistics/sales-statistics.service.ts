// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SalesStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  private toNumber(value: any): number {
    if (typeof value === "number") return value;
    if (typeof value === "bigint") return Number(value);
    if (
      value &&
      typeof value === "object" &&
      typeof value.toNumber === "function"
    ) {
      try {
        return value.toNumber();
      } catch (error) {
        // ignore conversion error
      }
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private normalizeSkuData(raw: any): string {
    if (!raw) return "";
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (Array.isArray(item)) {
              return item.join(":");
            }
            if (item && typeof item === "object") {
              const [key, value] = Object.entries(item)[0] ?? ["", ""];
              if (key || value) {
                return `${key}:${value}`;
              }
            }
            return String(item ?? "");
          })
          .filter(Boolean)
          .join("|");
      }
    } catch (error) {
      // ignore parse error
    }
    return typeof raw === "string" ? raw : JSON.stringify(raw);
  }

  private normalizeDateRange(input: unknown): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    const toDate = (value: any): Date | null => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    let range: string[] | null = null;

    if (Array.isArray(input)) {
      range = input;
    } else if (typeof input === "string") {
      const trimmed = input.trim();
      if (trimmed) {
        if (trimmed.startsWith("[")) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              range = parsed;
            }
          } catch (error) {
            // ignore json parse error
          }
        } else if (trimmed.includes(",")) {
          range = trimmed.split(",").map((item) => item.trim());
        } else if (/^\d{4}$/.test(trimmed)) {
          const year = Number(trimmed);
          startDate = this.startOfDay(new Date(year, 0, 1));
          endDate = this.endOfDay(new Date(year, 11, 31));
        } else {
          range = [trimmed, trimmed];
        }
      }
    }

    if (range && range.length >= 2) {
      const parsedStart = toDate(range[0]);
      const parsedEnd = toDate(range[1]);
      if (parsedStart) {
        startDate = this.startOfDay(parsedStart);
      }
      if (parsedEnd) {
        endDate = this.endOfDay(parsedEnd);
      }
    }

    if (!startDate || !endDate) {
      const currentYear = now.getFullYear();
      startDate = this.startOfDay(new Date(currentYear, 0, 1));
      endDate = this.endOfDay(new Date(currentYear, 11, 31));
    }

    if (startDate.getTime() > endDate.getTime()) {
      const tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }

    return { startDate, endDate };
  }

  private buildAxis(
    dateType: number,
    startDate: Date,
    endDate: Date,
  ): string[] {
    const axis: string[] = [];
    if (dateType === 1) {
      const cursor = new Date(startDate.getTime());
      cursor.setDate(1);
      cursor.setHours(0, 0, 0, 0);
      while (cursor.getTime() <= endDate.getTime()) {
        axis.push(
          `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(
            2,
            "0",
          )}`,
        );
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      const cursor = new Date(startDate.getTime());
      cursor.setHours(0, 0, 0, 0);
      while (cursor.getTime() <= endDate.getTime()) {
        axis.push(cursor.toISOString().split("T")[0]);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return axis;
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
          order_status: 3, // 假设 3 表示已完成状态
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

    // 使用 findMany 和手动计算替代 groupBy
    const orderItems = await this.prisma.order_item.findMany({
      where: {
        order: {
          shop_id: shopId,
          order_status: 3, // 假设 3 表示已完成状态
        },
      },
      select: {
        product_id: true,
        quantity: true,
        price: true,
      },
    });

    // 手动分组计算
    const productMap = new Map();
    orderItems.forEach((item) => {
      const productId = item.product_id;
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          _sum: { quantity: 0, price: 0 },
        });
      }
      const product = productMap.get(productId);
      product._sum.quantity += Number(item.quantity);
      product._sum.price += Number(item.price) * Number(item.quantity);
    });

    const products = Array.from(productMap.values())
      .sort((a, b) => b._sum.quantity - a._sum.quantity)
      .slice(0, limit);

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

    // 使用 findMany 和手动计算替代 groupBy
    const orders = await this.prisma.order.findMany({
      where: {
        shop_id: shopId,
        status: "completed",
      },
      select: {
        payment_method: true,
        total_amount: true,
      },
    });

    // 手动分组计算
    const paymentMap = new Map();
    orders.forEach((order) => {
      const method = order.payment_method || "unknown";
      if (!paymentMap.has(method)) {
        paymentMap.set(method, {
          payment_method: method,
          _sum: { total_amount: 0 },
          _count: { _all: 0 },
        });
      }
      const payment = paymentMap.get(method);
      payment._sum.total_amount += Number(order.total_amount);
      payment._count._all++;
    });

    const paymentStats = Array.from(paymentMap.values());

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

  async getSalesData(filter: {
    shop_id: number;
    statistic_type?: number;
    date_type?: number;
    start_end_time?: string | string[];
    is_export?: number;
  }) {
    const shopId = filter?.shop_id ?? -1;
    const statisticType = Number(filter?.statistic_type ?? 1);
    const dateType = Number(filter?.date_type ?? 1);

    const { startDate, endDate } = this.normalizeDateRange(
      filter?.start_end_time,
    );

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const rangeDiff = Math.max(endDate.getTime() - startDate.getTime(), 0);
    const prevEndDateCandidate = new Date(startDate.getTime() - 1000);
    const prevEndDate = this.endOfDay(prevEndDateCandidate);
    const prevStartDateCandidate = new Date(prevEndDate.getTime() - rangeDiff);
    const prevStartDate = this.startOfDay(prevStartDateCandidate);

    const prevStartTimestamp = Math.floor(prevStartDate.getTime() / 1000);
    const prevEndTimestamp = Math.floor(prevEndDate.getTime() / 1000);

    const orderWhereCurrent: any = {
      is_del: 0,
      pay_status: 2, // PAYMENT_PAID
      pay_time: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
    };
    const orderWherePrev: any = {
      is_del: 0,
      pay_status: 2, // PAYMENT_PAID
      pay_time: {
        gte: prevStartTimestamp,
        lte: prevEndTimestamp,
      },
    };
    if (shopId > 0) {
      orderWhereCurrent.shop_id = shopId;
      orderWherePrev.shop_id = shopId;
    }

    const [currentOrders, prevOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: orderWhereCurrent,
        _sum: { total_amount: true },
      }),
      this.prisma.order.aggregate({
        where: orderWherePrev,
        _sum: { total_amount: true },
      }),
    ]);

    // Refund totals: sum of online_balance + offline_balance + refund_balance from refund_apply with status PROCESSED (2)
    const refundWhereCurrent: any = {
      refund_status: 2,
      add_time: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
    };
    const refundWherePrev: any = {
      refund_status: 2,
      add_time: {
        gte: prevStartTimestamp,
        lte: prevEndTimestamp,
      },
    };
    if (shopId > 0) {
      refundWhereCurrent.shop_id = shopId;
      refundWherePrev.shop_id = shopId;
    }

    const [currentRefundSums, prevRefundSums] = await Promise.all([
      this.prisma.refund_apply.aggregate({
        where: refundWhereCurrent,
        _sum: {
          online_balance: true,
          offline_balance: true,
          refund_balance: true,
        },
      }),
      this.prisma.refund_apply.aggregate({
        where: refundWherePrev,
        _sum: {
          online_balance: true,
          offline_balance: true,
          refund_balance: true,
        },
      }),
    ]);

    // Balance payments: sum of balance field for paid-time range and valid order_status (confirmed, processing, completed).
    const balanceWhereCurrent: any = {
      is_del: 0,
      order_status: { in: [1, 2, 5] },
      pay_time: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
    };
    const balanceWherePrev: any = {
      is_del: 0,
      order_status: { in: [1, 2, 5] },
      pay_time: {
        gte: prevStartTimestamp,
        lte: prevEndTimestamp,
      },
    };
    if (shopId > 0) {
      balanceWhereCurrent.shop_id = shopId;
      balanceWherePrev.shop_id = shopId;
    }

    const [currentBalanceOrders, prevBalanceOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: balanceWhereCurrent,
        _sum: { balance: true },
      }),
      this.prisma.order.aggregate({
        where: balanceWherePrev,
        _sum: { balance: true },
      }),
    ]);

    const [currentRecharge, prevRecharge] = await Promise.all([
      this.prisma.user_recharge_order.aggregate({
        where: {
          status: true,
          paid_time: {
            gte: startTimestamp,
            lte: endTimestamp,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.user_recharge_order.aggregate({
        where: {
          status: true,
          paid_time: {
            gte: prevStartTimestamp,
            lte: prevEndTimestamp,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) {
        if (current === 0) return 0;
        return current > 0 ? 100 : -100;
      }
      return ((current - previous) / previous) * 100;
    };

    const productPayment = this.toNumber(currentOrders._sum.total_amount);
    const prevProductPayment = this.toNumber(prevOrders._sum.total_amount);
    const productRefund = this.toNumber(
      (currentRefundSums._sum.online_balance ?? 0) +
        (currentRefundSums._sum.offline_balance ?? 0) +
        (currentRefundSums._sum.refund_balance ?? 0),
    );
    const prevProductRefund = this.toNumber(
      (prevRefundSums._sum.online_balance ?? 0) +
        (prevRefundSums._sum.offline_balance ?? 0) +
        (prevRefundSums._sum.refund_balance ?? 0),
    );

    let rechargeAmount = this.toNumber(currentRecharge._sum.amount);
    let prevRechargeAmount = this.toNumber(prevRecharge._sum.amount);

    if (shopId > 0) {
      rechargeAmount = 0;
      prevRechargeAmount = 0;
    }

    const balancePayment = this.toNumber(currentBalanceOrders._sum.balance);
    const prevBalancePayment = this.toNumber(prevBalanceOrders._sum.balance);

    const productPaymentFixed = Number(productPayment.toFixed(2));
    const productRefundFixed = Number(productRefund.toFixed(2));
    const rechargeAmountFixed = Number(rechargeAmount.toFixed(2));
    const balancePaymentFixed = Number(balancePayment.toFixed(2));

    const turnover = Number(
      (productPaymentFixed + rechargeAmountFixed).toFixed(2),
    );
    const prevTurnover = prevProductPayment + prevRechargeAmount;

    const salesData = {
      productPayment: productPaymentFixed,
      productPaymentGrowthRate: Number(
        calculateGrowthRate(productPayment, prevProductPayment).toFixed(4),
      ),
      productRefund: productRefundFixed,
      productRefundGrowthRate: Number(
        calculateGrowthRate(productRefund, prevProductRefund).toFixed(4),
      ),
      rechargeAmount: rechargeAmountFixed,
      rechargeAmountGrowthRate: Number(
        calculateGrowthRate(rechargeAmount, prevRechargeAmount).toFixed(4),
      ),
      turnover,
      turnoverGrowthRate: Number(
        calculateGrowthRate(turnover, prevTurnover).toFixed(4),
      ),
      balancePayment: balancePaymentFixed,
      balancePaymentGrowthRate: Number(
        calculateGrowthRate(balancePayment, prevBalancePayment).toFixed(4),
      ),
    };

    const salesStatisticsData = await this.getSalesStatisticsData(
      dateType,
      startDate,
      endDate,
      statisticType,
      shopId,
    );

    return {
      salesData,
      salesStatisticsData,
    };
  }

  async getSalesStatisticsData(
    dateType: number,
    startDate: Date,
    endDate: Date,
    statisticType: number,
    shopId: number,
  ) {
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`o.is_del = 0`,
      Prisma.sql`o.pay_status = 2`,
      Prisma.sql`o.pay_time BETWEEN ${startTimestamp} AND ${endTimestamp}`,
    ];

    if (shopId > -1) {
      whereConditions.push(Prisma.sql`o.shop_id = ${shopId}`);
    }

    const whereClause = whereConditions.length
      ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
      : Prisma.sql``;

    const periodExpression =
      dateType === 1
        ? Prisma.sql`DATE_FORMAT(FROM_UNIXTIME(o.pay_time), '%Y-%m')`
        : Prisma.sql`DATE_FORMAT(FROM_UNIXTIME(o.pay_time), '%Y-%m-%d')`;

    const aggregated = await this.prisma.$queryRaw<
      Array<{ period: string; total_amount: any; order_count: any }>
    >(Prisma.sql`
      SELECT
        ${periodExpression} AS period,
        SUM(o.total_amount) AS total_amount,
        COUNT(*) AS order_count
      FROM \`order\` o
      ${whereClause}
      GROUP BY period
      ORDER BY period
    `);

    const horizontalAxis = this.buildAxis(dateType, startDate, endDate);
    const aggregatedMap = new Map(
      aggregated.map((record) => [record.period, record] as const),
    );

    const longitudinalAxis = horizontalAxis.map((period) => {
      const record = aggregatedMap.get(period);
      if (!record) return 0;
      if (statisticType) {
        return Number(this.toNumber(record.total_amount).toFixed(2));
      }
      return this.toNumber(record.order_count);
    });

    return {
      horizontalAxis,
      longitudinalAxis,
    };
  }

  async getSalesIndicators(shopId: number) {
    const [
      totalOrders,
      totalOrderProductsResult,
      totalOrderAmount,
      totalUsers,
      consumerMembershipNum,
      clickCount,
    ] = await Promise.all([
      this.prisma.order
        .count({
          where: {
            shop_id: shopId,
            is_del: 0,
            order_status: { in: [1, 2, 5] }, // ORDER_CONFIRMED, ORDER::ORDER_PROCESSING, Order::ORDER_COMPLETED
          },
        })
        .catch(() => 0),

      this.prisma
        .$queryRaw({
          sql: `SELECT COUNT(*) as count FROM order_item oi JOIN \`order\` o ON oi.order_id = o.order_id WHERE o.is_del = 0 AND o.order_status IN (1, 2, 5) -- ORDER_CONFIRMED, ORDER::ORDER_PROCESSING, Order::ORDER_COMPLETED AND o.pay_status = 2 ${shopId > -1 ? `AND oi.shop_id = ${shopId}` : ""}`,
          args: [],
        })
        .then((result: any) =>
          Array.isArray(result) && result.length > 0
            ? Number(result[0].count)
            : 0,
        )
        .catch(() => 0),

      this.prisma.order
        .aggregate({
          where: {
            shop_id: shopId,
            is_del: 0,
            order_status: { in: [1, 2, 5] }, // ORDER_CONFIRMED, ORDER::ORDER_PROCESSING, Order::ORDER_COMPLETED
          },
          _sum: { total_amount: true },
        })
        .catch(() => ({ _sum: { total_amount: 0 } })),

      this.prisma.user.count().catch(() => 0),

      this.prisma.order
        .findMany({
          where: {
            shop_id: shopId,
            is_del: 0,
            order_status: { in: [1, 2, 5] }, // ORDER_CONFIRMED, ORDER::ORDER_PROCESSING, Order::ORDER_COMPLETED
          },
          select: { user_id: true },
          distinct: ["user_id"],
        })
        .then((result) => (Array.isArray(result) ? result.length : 0))
        .catch(() => 0),

      this.prisma.product
        .aggregate({
          where: { shop_id: shopId, is_delete: 0 },
          _sum: { click_count: true },
        })
        .catch(() => ({ _sum: { click_count: 0 } })),
    ]);

    // 计算各种比率
    const userNum = totalUsers || 1;
    const orderNum = totalOrders || 0;
    const orderTotalAmount = totalOrderAmount._sum.total_amount || 0;
    const clickCountValue = clickCount._sum.click_count || 0;
    const totalOrderProducts = totalOrderProductsResult;

    const capitaConsumption =
      userNum > 0 ? Number((orderTotalAmount / userNum).toFixed(2)) : 0;
    const clickRate =
      clickCountValue > 0
        ? Number(((orderNum / clickCountValue) * 100).toFixed(2))
        : 0;
    const orderRate =
      clickCountValue > 0
        ? Number(((orderTotalAmount / clickCountValue) * 100).toFixed(2))
        : 0;
    const consumerMembershipRate =
      userNum > 0
        ? Number(((consumerMembershipNum / userNum) * 100).toFixed(2))
        : 0;
    const purchaseRate =
      userNum > 0 ? Number(((orderNum / userNum) * 100).toFixed(2)) : 0;

    return {
      orderNum: orderNum,
      orderProductNum: totalOrderProducts,
      orderTotalAmount: Number(orderTotalAmount.toFixed(2)),
      userNum: totalUsers,
      consumerMembershipNum: consumerMembershipNum,
      capitaConsumption: capitaConsumption,
      clickCount: clickCountValue,
      clickRate: clickRate,
      orderRate: orderRate,
      consumerMembershipRate: consumerMembershipRate,
      purchaseRate: purchaseRate,
    };
  }

  async getSalesDetail(filter: {
    shop_id: number;
    start_time?: string;
    end_time?: string;
  }) {
    const shopId = filter?.shop_id ?? -1;
    const startTime = filter?.start_time;
    const endTime = filter?.end_time;

    if (!startTime || !endTime) {
      throw new Error("请选择日期");
    }

    // 按照PHP逻辑处理时间范围
    const startEndTime: [string, string] = [startTime, endTime];

    // 获取环比时间区间 - PHP中的 getPrevDate 方法
    const getPrevDate = (
      dateRange: string[],
      dateType: number,
    ): [number, number] => {
      const start = new Date(dateRange[0]);
      const end = new Date(dateRange[1]);
      const diffTime = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - diffTime);

      return [
        Math.floor(prevStart.getTime() / 1000),
        Math.floor(prevEnd.getTime() / 1000),
      ];
    };

    const prevDate = getPrevDate(startEndTime, 4); // 4表示日期类型

    // 转换时间戳 - PHP使用strtotime
    const currentStartTime = Math.floor(new Date(startTime).getTime() / 1000);
    const currentEndTime = Math.floor(new Date(endTime).getTime() / 1000);

    // 商品浏览量 - PHP调用 StatisticsService::getVisitNumByProduct
    const getProductView = async (
      timeRange: [number, number],
      shopId: number,
    ): Promise<number> => {
      // 简化实现，返回模拟数据
      return 0;
    };

    // 商品访客数
    const getProductVisitor = async (
      timeRange: [number, number],
      shopId: number,
    ): Promise<number> => {
      // 简化实现，返回模拟数据
      return 0;
    };

    // 下单件数 - PHP调用 OrderService::getOrderTotal
    const getOrderTotal = async (
      timeRange: [number, number],
      shopId: number,
    ): Promise<number> => {
      return await this.prisma.order.count({
        where: {
          shop_id: shopId,
          add_time: {
            gte: timeRange[0],
            lte: timeRange[1],
          },
          is_del: 0,
        },
      });
    };

    // 支付金额 - PHP调用 OrderService::getPayMoneyTotal
    const getPayMoneyTotal = async (
      timeRange: [number, number],
      shopId: number,
    ): Promise<number> => {
      const result = await this.prisma.order.aggregate({
        where: {
          shop_id: shopId,
          pay_status: 2, // PAYMENT_PAID
          pay_time: {
            gte: timeRange[0],
            lte: timeRange[1],
          },
          is_del: 0,
        },
        _sum: {
          total_amount: true,
        },
      });
      return Number(result._sum.total_amount || 0);
    };

    // 退款金额 - PHP调用 RefundApplyService::getRefundTotal
    const getRefundTotal = async (
      timeRange: [number, number],
      shopId: number,
    ): Promise<number> => {
      // 简化实现，返回0
      return 0;
    };

    // 退款件数 - PHP调用 RefundApplyService::getRefundItemTotal
    const getRefundItemTotal = async (
      timeRange: [number, number],
      shopId: number,
    ): Promise<number> => {
      // 简化实现，返回0
      return 0;
    };

    // 计算增长率 - PHP中的 getGrowthRate 方法
    const getGrowthRate = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    // 并行获取所有数据
    const [
      productView,
      prevProductView,
      productVisitor,
      prevProductVisitor,
      orderNum,
      prevOrderNum,
      paymentAmount,
      prevPaymentAmount,
      refundAmount,
      prevRefundAmount,
      refundQuantity,
      prevRefundQuantity,
    ] = await Promise.all([
      getProductView([currentStartTime, currentEndTime], shopId),
      getProductView(prevDate, shopId),
      getProductVisitor([currentStartTime, currentEndTime], shopId),
      getProductVisitor(prevDate, shopId),
      getOrderTotal([currentStartTime, currentEndTime], shopId),
      getOrderTotal(prevDate, shopId),
      getPayMoneyTotal([currentStartTime, currentEndTime], shopId),
      getPayMoneyTotal(prevDate, shopId),
      getRefundTotal([currentStartTime, currentEndTime], shopId),
      getRefundTotal(prevDate, shopId),
      getRefundItemTotal([currentStartTime, currentEndTime], shopId),
      getRefundItemTotal(prevDate, shopId),
    ]);

    // 计算增长率
    const productViewGrowthRate = getGrowthRate(productView, prevProductView);
    const productVisitorGrowthRate = getGrowthRate(
      productVisitor,
      prevProductVisitor,
    );
    const orderNumGrowthRate = getGrowthRate(orderNum, prevOrderNum);
    const paymentAmountGrowthRate = getGrowthRate(
      paymentAmount,
      prevPaymentAmount,
    );
    const refundAmountGrowthRate = getGrowthRate(
      refundAmount,
      prevRefundAmount,
    );
    const refundQuantityGrowthRate = getGrowthRate(
      refundQuantity,
      prevRefundQuantity,
    );

    // 按照PHP返回结构
    const salesData = {
      productView,
      productViewGrowthRate,
      productVisitor,
      productVisitorGrowthRate,
      orderNum,
      orderNumGrowthRate,
      paymentAmount: Number(paymentAmount.toFixed(2)),
      paymentAmountGrowthRate,
      refundAmount: Number(refundAmount.toFixed(2)),
      refundAmountGrowthRate,
      refundQuantity,
      refundQuantityGrowthRate,
    };

    // 获取图表数据 - PHP调用 getSalesStatisticsDetail
    const salesStatisticsData = await this.getSalesStatisticsDetail(
      [currentStartTime, currentEndTime],
      shopId,
    );

    return {
      salesData,
      salesStatisticsData,
    };
  }

  async getSalesRanking(shopId: number, params: Record<string, any> = {}) {
    const pickParam = (...keys: string[]) => {
      for (const key of keys) {
        if (
          params[key] !== undefined &&
          params[key] !== null &&
          params[key] !== ""
        ) {
          return params[key];
        }
      }
      return undefined;
    };

    const startTimeInput = pickParam("startTime", "start_time");
    const endTimeInput = pickParam("endTime", "end_time");
    const keyword = (pickParam("keyword") ?? "").toString().trim();
    const pageRaw = pickParam("page", "pageNo", "page_no");
    const sizeRaw = pickParam("size", "pageSize", "page_size", "limit");
    const sortFieldInput = (
      pickParam("sortField", "sort_field") ?? "total_sales_amount"
    ).toString();
    const sortOrderInput = (
      pickParam("sortOrder", "sort_order") ?? "desc"
    ).toString();

    const toTimestamp = (value?: string) => {
      if (!value) return undefined;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return undefined;
      }
      return Math.floor(date.getTime() / 1000);
    };

    const startTimestamp = toTimestamp(startTimeInput);
    const endTimestamp = toTimestamp(endTimeInput);

    const pageValue = Number(pageRaw ?? 1);
    const sizeValue = Number(sizeRaw ?? 15);
    const page =
      Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
    const size =
      Number.isFinite(sizeValue) && sizeValue > 0
        ? Math.min(Math.floor(sizeValue), 200)
        : 15;
    const offset = (page - 1) * size;

    const conditions: Prisma.Sql[] = [
      Prisma.sql`o.is_del = 0`,
      Prisma.sql`o.order_status IN (1, 2, 3)`,
    ];

    if (shopId > -1) {
      conditions.push(Prisma.sql`oi.shop_id = ${shopId}`);
    }

    if (startTimestamp && endTimestamp) {
      conditions.push(
        Prisma.sql`o.add_time BETWEEN ${startTimestamp} AND ${endTimestamp}`,
      );
    }

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      conditions.push(
        Prisma.sql`(oi.product_name LIKE ${likeKeyword} OR oi.product_sn LIKE ${likeKeyword})`,
      );
    }

    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.sql``;

    const baseQuery = Prisma.sql`
      FROM order_item oi
      INNER JOIN \`order\` o ON o.order_id = oi.order_id
      ${whereClause}
    `;

    const sortFieldMap: Record<string, Prisma.Sql> = {
      total_sales_amount: Prisma.sql`total_sales_amount`,
      total_sales_num: Prisma.sql`total_sales_num`,
      product_name: Prisma.sql`product_name`,
      product_sn: Prisma.sql`product_sn`,
      product_id: Prisma.sql`oi.product_id`,
    };

    const normalizedSortField =
      sortFieldMap[sortFieldInput] ?? sortFieldMap.total_sales_amount;
    const normalizedSortOrder =
      sortOrderInput.toLowerCase() === "asc"
        ? Prisma.sql`ASC`
        : Prisma.sql`DESC`;
    const orderByClause = Prisma.sql`ORDER BY ${normalizedSortField} ${normalizedSortOrder}`;

    const countResult = await this.prisma.$queryRaw<
      Array<{ total: bigint | number }>
    >(Prisma.sql`
      SELECT COUNT(DISTINCT oi.product_id) AS total
      ${baseQuery}
    `);

    const listQuery = Prisma.sql`
      SELECT
        oi.product_id,
        MAX(oi.product_name) AS product_name,
        MAX(oi.product_sn) AS product_sn,
        MAX(oi.sku_data) AS sku_data,
        SUM(oi.quantity) AS total_sales_num,
        SUM(oi.quantity * oi.price) AS total_sales_amount
      ${baseQuery}
      GROUP BY oi.product_id
      ${orderByClause}
      LIMIT ${size}
      OFFSET ${offset}
    `;

    const records =
      await this.prisma.$queryRaw<Array<Record<string, any>>>(listQuery);

    const list = records.map((record) => ({
      product_id: record.product_id,
      product_name: record.product_name,
      product_sn: record.product_sn,
      sku_data: this.normalizeSkuData(record.sku_data),
      total_sales_num: this.toNumber(record.total_sales_num),
      total_sales_amount: Number(
        this.toNumber(record.total_sales_amount).toFixed(2),
      ),
    }));

    const totalRaw = countResult?.[0]?.total ?? 0;
    const total =
      typeof totalRaw === "bigint" ? Number(totalRaw) : Number(totalRaw);

    return {
      count: total,
      list,
    };
  }

  async getSaleProductDetail(shopId: number, params: Record<string, any> = {}) {
    const pickParam = (...keys: string[]) => {
      for (const key of keys) {
        if (
          params[key] !== undefined &&
          params[key] !== null &&
          params[key] !== ""
        ) {
          return params[key];
        }
      }
      return undefined;
    };

    const startTimeInput = pickParam("startTime", "start_time");
    const endTimeInput = pickParam("endTime", "end_time");
    const keyword = (pickParam("keyword") ?? "").toString().trim();
    const pageRaw = pickParam("page", "pageNo", "page_no");
    const sizeRaw = pickParam("size", "pageSize", "page_size", "limit");
    const sortFieldInput = (
      pickParam("sortField", "sort_field") ?? "item_id"
    ).toString();
    const sortOrderInput = (
      pickParam("sortOrder", "sort_order") ?? "desc"
    ).toString();

    const toTimestamp = (value?: string) => {
      if (!value) return undefined;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return undefined;
      }
      return Math.floor(date.getTime() / 1000);
    };

    const startTimestamp = toTimestamp(startTimeInput);
    const endTimestamp = toTimestamp(endTimeInput);

    const pageValue = Number(pageRaw ?? 1);
    const sizeValue = Number(sizeRaw ?? 15);
    const page =
      Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
    const size =
      Number.isFinite(sizeValue) && sizeValue > 0
        ? Math.min(Math.floor(sizeValue), 200)
        : 15;
    const offset = (page - 1) * size;

    const conditions: Prisma.Sql[] = [
      Prisma.sql`o.is_del = 0`,
      Prisma.sql`o.order_status IN (1, 2, 3)`,
    ];

    if (shopId > -1) {
      conditions.push(Prisma.sql`oi.shop_id = ${shopId}`);
    }

    if (startTimestamp && endTimestamp) {
      conditions.push(
        Prisma.sql`o.add_time BETWEEN ${startTimestamp} AND ${endTimestamp}`,
      );
    }

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      conditions.push(
        Prisma.sql`(oi.product_name LIKE ${likeKeyword} OR oi.product_sn LIKE ${likeKeyword})`,
      );
    }

    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.sql``;

    const baseQuery = Prisma.sql`
        FROM order_item oi
        INNER JOIN \`order\` o ON o.order_id = oi.order_id
        ${whereClause}
      `;

    const sortableFields: Record<string, Prisma.Sql> = {
      item_id: Prisma.sql`oi.item_id`,
      product_id: Prisma.sql`oi.product_id`,
      product_name: Prisma.sql`oi.product_name`,
      product_sn: Prisma.sql`oi.product_sn`,
      quantity: Prisma.sql`oi.quantity`,
      price: Prisma.sql`oi.price`,
      subtotal: Prisma.sql`oi.quantity * oi.price`,
      order_sn: Prisma.sql`o.order_sn`,
      add_time: Prisma.sql`o.add_time`,
    };

    const normalizedSortField =
      sortableFields[sortFieldInput] ?? sortableFields.item_id;
    const normalizedSortOrder =
      sortOrderInput.toLowerCase() === "asc"
        ? Prisma.sql`ASC`
        : Prisma.sql`DESC`;

    const orderByClause = Prisma.sql`ORDER BY ${normalizedSortField} ${normalizedSortOrder}`;

    const countResult = await this.prisma.$queryRaw<
      Array<{ total: bigint | number }>
    >(Prisma.sql`
        SELECT COUNT(*) AS total
        ${baseQuery}
      `);

    const listQuery = Prisma.sql`
        SELECT
          oi.item_id,
          oi.product_id,
          oi.product_name,
          oi.product_sn,
          oi.sku_data,
          oi.quantity,
          oi.price,
          (oi.quantity * oi.price) AS subtotal,
          o.order_sn,
          o.add_time
        ${baseQuery}
        ${orderByClause}
        LIMIT ${size}
        OFFSET ${offset}
      `;

    const records =
      await this.prisma.$queryRaw<Array<Record<string, any>>>(listQuery);

    const list = records.map((record) => ({
      item_id: record.item_id,
      product_id: record.product_id,
      product_name: record.product_name,
      product_sn: record.product_sn,
      sku_data: this.normalizeSkuData(record.sku_data),
      quantity: this.toNumber(record.quantity),
      price: Number(this.toNumber(record.price).toFixed(2)),
      subtotal: Number(this.toNumber(record.subtotal).toFixed(2)),
      order_sn: record.order_sn,
      add_time: this.toNumber(record.add_time),
    }));

    const totalRaw = countResult?.[0]?.total ?? 0;
    const total =
      typeof totalRaw === "bigint" ? Number(totalRaw) : Number(totalRaw);

    return {
      count: total,
      list,
    };
  }

  // 销售明细图表 - 对应PHP的 getSalesStatisticsDetail 方法
  private async getSalesStatisticsDetail(
    timeRange: [number, number],
    shopId: number,
  ) {
    // 横轴 - PHP中的 getHorizontalAxis
    const getHorizontalAxis = (
      dateType: number,
      startDate: string,
      endDate: string,
    ): string[] => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      const axis = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        axis.push(date.toISOString().split("T")[0]);
      }
      return axis;
    };

    // 支付金额列表 - PHP中的 OrderService::getPayMoneyList
    const getPayMoneyList = async (
      timeRange: [number, number],
      shopId: number,
    ) => {
      const orders = await this.prisma.order.findMany({
        where: {
          shop_id: shopId,
          pay_status: 2, // PAYMENT_PAID
          pay_time: {
            gte: timeRange[0],
            lte: timeRange[1],
          },
          is_del: 0,
        },
        select: {
          pay_time: true,
          total_amount: true,
        },
      });

      // 按日期分组
      const dailyData = new Map();
      orders.forEach((order) => {
        const date = new Date(order.pay_time * 1000)
          .toISOString()
          .split("T")[0];
        if (!dailyData.has(date)) {
          dailyData.set(date, { period: date, total_amount: 0 });
        }
        dailyData.get(date).total_amount += Number(order.total_amount);
      });

      return Array.from(dailyData.values());
    };

    // 获取纵轴数据 - PHP中的 getLongitudinalAxis
    const getLongitudinalAxis = (
      horizontalAxis: string[],
      dataList: any[],
      dateType: number,
      dataType: number,
    ): number[] => {
      return horizontalAxis.map((date) => {
        const data = dataList.find((item) => item.period === date);
        if (!data) return 0;

        switch (dataType) {
          case 4: // 支付金额
            return Number(data.total_amount || 0);
          case 6: // 退款金额
            return Number(data.refund_amount || 0);
          default:
            return 0;
        }
      });
    };

    const horizontalAxis = getHorizontalAxis(
      0,
      timeRange[0].toString(),
      timeRange[1].toString(),
    );
    const paymentAmountList = await getPayMoneyList(timeRange, shopId);

    // 简化其他数据，只返回支付金额数据
    const longitudinalAxisPaymentAmount = getLongitudinalAxis(
      horizontalAxis,
      paymentAmountList,
      0,
      4,
    );

    return {
      horizontalAxis,
      longitudinalAxisPaymentAmount,
      longitudinalAxisRefundAmount: new Array(horizontalAxis.length).fill(0),
      longitudinalAxisProductView: new Array(horizontalAxis.length).fill(0),
      longitudinalAxisProductVisitor: new Array(horizontalAxis.length).fill(0),
    };
  }
}
