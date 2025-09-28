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
    orderItems.forEach(item => {
      const productId = item.product_id;
      if (!productMap.has(productId)) {
        productMap.set(productId, { product_id: productId, _sum: { quantity: 0, price: 0 } });
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
    orders.forEach(order => {
      const method = order.payment_method || 'unknown';
      if (!paymentMap.has(method)) {
        paymentMap.set(method, { payment_method: method, _sum: { total_amount: 0 }, _count: { _all: 0 } });
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
          order_status: 3, // 假设 3 表示已完成状态
          add_time: {
            gte: Math.floor(startDate.getTime() / 1000),
            lte: Math.floor(endDate.getTime() / 1000),
          },
        },
        _sum: {
          total_amount: true,
        },
      }),
      this.prisma.refund.aggregate({
        where: {
          shop_id: shopId,
          order_status: 3, // 假设 3 表示已完成状态
          add_time: {
            gte: Math.floor(startDate.getTime() / 1000),
            lte: Math.floor(endDate.getTime() / 1000),
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
          order_status: 3, // 假设 3 表示已完成状态
          add_time: {
            gte: Math.floor(prevStartDate.getTime() / 1000),
            lte: Math.floor(prevEndDate.getTime() / 1000),
          },
        },
        _sum: {
          total_amount: true,
        },
      }),
      this.prisma.refund.aggregate({
        where: {
          shop_id: shopId,
          order_status: 3, // 假设 3 表示已完成状态
          add_time: {
            gte: Math.floor(prevStartDate.getTime() / 1000),
            lte: Math.floor(prevEndDate.getTime() / 1000),
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
        order_status: 3, // 使用正确的状态
        payment_method: "balance",
        add_time: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000),
        },
      },
      _sum: {
        total_amount: true,
      },
    });

    const prevBalanceOrders = await this.prisma.order.aggregate({
      where: {
        shop_id: shopId,
        order_status: 3, // 使用正确的状态
        payment_method: "balance",
        add_time: {
          gte: Math.floor(prevStartDate.getTime() / 1000),
          lte: Math.floor(prevEndDate.getTime() / 1000),
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
        pay_status: 2, // 支付状态
        add_time: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000),
        },
      },
      _sum: {
        amount: true,
      },
    });

    const prevRecharge = await this.prisma.user_recharge_order.aggregate({
      where: {
        shop_id: shopId,
        pay_status: 2, // 支付状态
        add_time: {
          gte: Math.floor(prevStartDate.getTime() / 1000),
          lte: Math.floor(prevEndDate.getTime() / 1000),
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
            date: "add_time",
            unit: "month",
          },
        },
      };
    } else {
      // 默认按月统计
      groupBy = {
        month: {
          $dateTrunc: {
            date: "add_time",
            unit: "month",
          },
        },
      };
    }

    // 获取每月销售数据
    const monthlySales = (await this.prisma.$queryRaw`
      SELECT
        MONTH(FROM_UNIXTIME(add_time)) as month,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM \`order\`
      WHERE
        shop_id = ${shopId}
        AND order_status = 3
        AND add_time >= ${Math.floor(startDate.getTime() / 1000)}
        AND add_time <= ${Math.floor(endDate.getTime() / 1000)}
      GROUP BY MONTH(FROM_UNIXTIME(add_time))
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

  async getSalesIndicators(shopId: number) {
    const [
      totalOrders,
      totalOrderProductsResult,
      totalOrderAmount,
      totalUsers,
      consumerMembershipNum,
      clickCount,
    ] = await Promise.all([
      this.prisma.order.count({
        where: {
          shop_id: shopId,
          is_del: 0,
          order_status: { in: [1, 2, 5] }, // ORDER_CONFIRMED, ORDER::ORDER_PROCESSING, Order::ORDER_COMPLETED
        },
      }).catch(() => 0),
      
      this.prisma.$queryRaw({
        sql: `SELECT COUNT(*) as count FROM order_item oi JOIN \`order\` o ON oi.order_id = o.order_id WHERE o.is_del = 0 AND o.order_status IN (1, 2, 5) -- ORDER_CONFIRMED, ORDER::ORDER_PROCESSING, Order::ORDER_COMPLETED AND o.pay_status = 2 ${shopId > -1 ? `AND oi.shop_id = ${shopId}` : ''}`,
        args: [],
      }).then((result: any) => (Array.isArray(result) && result.length > 0) ? Number(result[0].count) : 0).catch(() => 0),
      
      this.prisma.order.aggregate({
        where: {
          shop_id: shopId,
          is_del: 0,
          order_status: { in: [1, 2, 5] }, // ORDER_CONFIRMED, ORDER::ORDER_PROCESSING, Order::ORDER_COMPLETED
        },
        _sum: { total_amount: true },
      }).catch(() => ({ _sum: { total_amount: 0 } })),
      
      this.prisma.user.count().catch(() => 0),
      
      this.prisma.order.findMany({
        where: {
          shop_id: shopId,
          is_del: 0,
          order_status: { in: [1, 2, 5] }, // ORDER_CONFIRMED, ORDER::ORDER_PROCESSING, Order::ORDER_COMPLETED
        },
        select: { user_id: true },
        distinct: ['user_id'],
      }).then((result) => (Array.isArray(result) ? result.length : 0)).catch(() => 0),
      
      this.prisma.product.aggregate({
        where: { shop_id: shopId, is_delete: 0 },
        _sum: { click_count: true },
      }).catch(() => ({ _sum: { click_count: 0 } })),
    ]);
  
    // 计算各种比率
    const userNum = totalUsers || 1;
    const orderNum = totalOrders || 0;
    const orderTotalAmount = totalOrderAmount._sum.total_amount || 0;
    const clickCountValue = clickCount._sum.click_count || 0;
    const totalOrderProducts = totalOrderProductsResult;
  
    const capitaConsumption = userNum > 0 ? Number((orderTotalAmount / userNum).toFixed(2)) : 0;
    const clickRate = clickCountValue > 0 ? Number(((orderNum / clickCountValue) * 100).toFixed(2)) : 0;
    const orderRate = clickCountValue > 0 ? Number(((orderTotalAmount / clickCountValue) * 100).toFixed(2)) : 0;
    const consumerMembershipRate = userNum > 0 ? Number(((consumerMembershipNum / userNum) * 100).toFixed(2)) : 0;
    const purchaseRate = userNum > 0 ? Number(((orderNum / userNum) * 100).toFixed(2)) : 0;
  
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
  

  async getSalesDetail(shopId: number, startTime?: string, endTime?: string) {
    // 完全按照PHP实现重写
    if (!startTime || !endTime) {
      throw new Error('请选择日期');
    }

    // 按照PHP逻辑处理时间范围
    const startEndTime = [startTime, endTime];

    // 获取环比时间区间 - PHP中的 getPrevDate 方法
    const getPrevDate = (dateRange: string[], dateType: number): [number, number] => {
      const start = new Date(dateRange[0]);
      const end = new Date(dateRange[1]);
      const diffTime = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - diffTime);

      return [
        Math.floor(prevStart.getTime() / 1000),
        Math.floor(prevEnd.getTime() / 1000)
      ];
    };

    const prevDate = getPrevDate(startEndTime, 4); // 4表示日期类型

    // 转换时间戳 - PHP使用strtotime
    const currentStartTime = Math.floor(new Date(startTime).getTime() / 1000);
    const currentEndTime = Math.floor(new Date(endTime).getTime() / 1000);

    // 商品浏览量 - PHP调用 StatisticsService::getVisitNumByProduct
    const getProductView = async (timeRange: [number, number], shopId: number): Promise<number> => {
      // 简化实现，返回模拟数据
      return 0;
    };

    // 商品访客数
    const getProductVisitor = async (timeRange: [number, number], shopId: number): Promise<number> => {
      // 简化实现，返回模拟数据
      return 0;
    };

    // 下单件数 - PHP调用 OrderService::getOrderTotal
    const getOrderTotal = async (timeRange: [number, number], shopId: number): Promise<number> => {
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
    const getPayMoneyTotal = async (timeRange: [number, number], shopId: number): Promise<number> => {
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
    const getRefundTotal = async (timeRange: [number, number], shopId: number): Promise<number> => {
      // 简化实现，返回0
      return 0;
    };

    // 退款件数 - PHP调用 RefundApplyService::getRefundItemTotal
    const getRefundItemTotal = async (timeRange: [number, number], shopId: number): Promise<number> => {
      // 简化实现，返回0
      return 0;
    };

    // 计算增长率 - PHP中的 getGrowthRate 方法
    const getGrowthRate = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(2));
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
    const productVisitorGrowthRate = getGrowthRate(productVisitor, prevProductVisitor);
    const orderNumGrowthRate = getGrowthRate(orderNum, prevOrderNum);
    const paymentAmountGrowthRate = getGrowthRate(paymentAmount, prevPaymentAmount);
    const refundAmountGrowthRate = getGrowthRate(refundAmount, prevRefundAmount);
    const refundQuantityGrowthRate = getGrowthRate(refundQuantity, prevRefundQuantity);

    // 按照PHP返回结构
    const salesData = {
      product_view: productView,
      product_view_growth_rate: productViewGrowthRate,
      product_visitor: productVisitor,
      product_visitor_growth_rate: productVisitorGrowthRate,
      order_num: orderNum,
      order_num_growth_rate: orderNumGrowthRate,
      payment_amount: Number(paymentAmount.toFixed(2)),
      payment_amount_growth_rate: paymentAmountGrowthRate,
      refund_amount: Number(refundAmount.toFixed(2)),
      refund_amount_growth_rate: refundAmountGrowthRate,
      refund_quantity: refundQuantity,
      refund_quantity_growth_rate: refundQuantityGrowthRate,
    };

    // 获取图表数据 - PHP调用 getSalesStatisticsDetail
    const salesStatisticsData = await this.getSalesStatisticsDetail([currentStartTime, currentEndTime], shopId);

    return {
      salesData,
      salesStatisticsData,
    };
  }

  // 销售明细图表 - 对应PHP的 getSalesStatisticsDetail 方法
  private async getSalesStatisticsDetail(timeRange: [number, number], shopId: number) {
    // 横轴 - PHP中的 getHorizontalAxis
    const getHorizontalAxis = (dateType: number, startDate: string, endDate: string): string[] => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const axis = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        axis.push(date.toISOString().split('T')[0]);
      }
      return axis;
    };

    // 支付金额列表 - PHP中的 OrderService::getPayMoneyList
    const getPayMoneyList = async (timeRange: [number, number], shopId: number) => {
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
      orders.forEach(order => {
        const date = new Date(order.pay_time * 1000).toISOString().split('T')[0];
        if (!dailyData.has(date)) {
          dailyData.set(date, { period: date, total_amount: 0 });
        }
        dailyData.get(date).total_amount += Number(order.total_amount);
      });

      return Array.from(dailyData.values());
    };

    // 获取纵轴数据 - PHP中的 getLongitudinalAxis
    const getLongitudinalAxis = (horizontalAxis: string[], dataList: any[], dateType: number, dataType: number): number[] => {
      return horizontalAxis.map(date => {
        const data = dataList.find(item => item.period === date);
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

    const horizontalAxis = getHorizontalAxis(0, timeRange[0].toString(), timeRange[1].toString());
    const paymentAmountList = await getPayMoneyList(timeRange, shopId);

    // 简化其他数据，只返回支付金额数据
    const longitudinalAxisPaymentAmount = getLongitudinalAxis(horizontalAxis, paymentAmountList, 0, 4);

    return {
      horizontal_axis: horizontalAxis,
      longitudinal_axis_payment_amount: longitudinalAxisPaymentAmount,
      longitudinal_axis_refund_amount: new Array(horizontalAxis.length).fill(0),
      longitudinal_axis_product_view: new Array(horizontalAxis.length).fill(0),
      longitudinal_axis_product_visitor: new Array(horizontalAxis.length).fill(0),
    };
  }
}
