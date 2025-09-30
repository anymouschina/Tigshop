// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AccountPanelService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const { search_start_date, search_end_date } = filter;

    // 获取基础统计数据
    const [totalBalance, totalFrozen, totalIncome, totalExpense] =
      await Promise.all([
        this.getTotalBalance(),
        this.getTotalFrozen(),
        this.getTotalIncome(search_start_date, search_end_date),
        this.getTotalExpense(search_start_date, search_end_date),
      ]);

    // 获取账户分布
    const accountDistribution = await this.getAccountDistribution();

    // 获取最近资金流水
    const recentFlows = await this.getRecentFlows();

    return {
      summary: {
        total_balance: totalBalance,
        total_frozen: totalFrozen,
        total_income: totalIncome,
        total_expense: totalExpense,
        net_flow: totalIncome - totalExpense,
      },
      account_distribution: accountDistribution,
      recent_flows: recentFlows,
    };
  }

  async getStatistics() {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayStats, monthStats, totalStats] = await Promise.all([
      this.getPeriodStats(startOfToday, now),
      this.getPeriodStats(startOfMonth, now),
      this.getTotalStats(),
    ]);

    return {
      today: todayStats,
      month: monthStats,
      total: totalStats,
    };
  }

  async getTrend(period: string) {
    const endDate = new Date();
    let startDate: Date;
    let dateFormat: string;

    switch (period) {
      case "week":
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = "%Y-%m-%d";
        break;
      case "month":
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = "%Y-%m-%d";
        break;
      default:
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        dateFormat = "%Y-%m-%d %H";
    }

    const trend = (await this.prisma.$queryRaw`
      SELECT
        DATE_FORMAT(FROM_UNIXTIME(change_time), ${dateFormat}) as date_key,
        SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as income,
        SUM(CASE WHEN balance < 0 THEN balance ELSE 0 END) as expense
      FROM user_balance_log
      WHERE change_time >= ${Math.floor(startDate.getTime() / 1000)} AND change_time <= ${Math.floor(endDate.getTime() / 1000)}
      GROUP BY DATE_FORMAT(FROM_UNIXTIME(change_time), ${dateFormat})
      ORDER BY date_key
    `) as any[];

    return trend;
  }

  async getBalanceRank(limit: number) {
    const rank = await this.prisma.user.findMany({
      select: {
        user_id: true,
        username: true,
        mobile: true,
        balance: true,
      },
      where: {
        balance: {
          gt: 0,
        },
      },
      orderBy: {
        balance: "desc",
      },
      take: limit,
    });

    return rank;
  }

  async getFlowDetail(filter: any) {
    const { start_date, end_date, type, page, size } = filter;

    const where: any = {};
    if (start_date && end_date) {
      where.change_time = {
        gte: Math.floor(new Date(start_date).getTime() / 1000),
        lte: Math.floor(new Date(end_date).getTime() / 1000),
      };
    }
    if (type) {
      where.change_type = parseInt(type);
    }

    const skip = (page - 1) * size;

    const [records, total] = await Promise.all([
      this.prisma.user_balance_log.findMany({
        where,
        skip,
        take: size,
        orderBy: { change_time: "desc" },
      }),
      this.prisma.user_balance_log.count({ where }),
    ]);

    return {
      records,
      total,
    };
  }

  private async getTotalBalance(): Promise<number> {
    const result = await this.prisma.user.aggregate({
      _sum: {
        balance: true,
      },
    });
    return Number(result._sum.balance || 0);
  }

  private async getTotalFrozen(): Promise<number> {
    const result = await this.prisma.user.aggregate({
      _sum: {
        frozen_balance: true,
      },
    });
    return Number(result._sum.frozen_balance || 0);
  }

  private async getTotalIncome(
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const where: any = { balance: { gt: 0 } };
    if (startDate && endDate) {
      where.change_time = {
        gte: Math.floor(new Date(startDate).getTime() / 1000),
        lte: Math.floor(new Date(endDate).getTime() / 1000),
      };
    }

    const result = await this.prisma.user_balance_log.aggregate({
      _sum: {
        balance: true,
      },
      where,
    });
    return Number(result._sum.balance || 0);
  }

  private async getTotalExpense(
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const where: any = { balance: { lt: 0 } };
    if (startDate && endDate) {
      where.change_time = {
        gte: Math.floor(new Date(startDate).getTime() / 1000),
        lte: Math.floor(new Date(endDate).getTime() / 1000),
      };
    }

    const result = await this.prisma.user_balance_log.aggregate({
      _sum: {
        balance: true,
      },
      where,
    });
    return Math.abs(Number(result._sum.balance || 0));
  }

  private async getAccountDistribution() {
    const distribution = (await this.prisma.$queryRaw`
      SELECT
        CASE
          WHEN balance = 0 THEN '0'
          WHEN balance BETWEEN 1 AND 100 THEN '1-100'
          WHEN balance BETWEEN 101 AND 1000 THEN '101-1000'
          WHEN balance BETWEEN 1001 AND 10000 THEN '1001-10000'
          ELSE '10000+'
        END as range,
        COUNT(*) as count
      FROM user
      GROUP BY range
      ORDER BY range
    `) as any[];

    return distribution;
  }

  private async getRecentFlows() {
    return (await this.prisma.$queryRaw`
      SELECT l.*, u.user_id, u.username, u.mobile
      FROM user_balance_log l
      JOIN user u ON u.user_id = l.user_id
      ORDER BY l.change_time DESC
      LIMIT 10
    `) as any[];
  }

  private async getPeriodStats(startDate: Date, endDate: Date) {
    const [income, expense, count] = await Promise.all([
      this.getTotalIncome(startDate.toISOString(), endDate.toISOString()),
      this.getTotalExpense(startDate.toISOString(), endDate.toISOString()),
      this.prisma.user_balance_log.count({
        where: {
          change_time: {
            gte: Math.floor(startDate.getTime() / 1000),
            lte: Math.floor(endDate.getTime() / 1000),
          },
        },
      }),
    ]);

    return {
      income,
      expense,
      count,
      net_flow: income - expense,
    };
  }

  private async getTotalStats() {
    const [totalBalance, totalIncome, totalExpense] = await Promise.all([
      this.getTotalBalance(),
      this.getTotalIncome(),
      this.getTotalExpense(),
    ]);

    return {
      total_balance: totalBalance,
      total_income: totalIncome,
      total_expense: totalExpense,
    };
  }
}
