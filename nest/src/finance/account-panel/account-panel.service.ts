import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AccountPanelService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const { search_start_date, search_end_date } = filter;

    // 获取基础统计数据
    const [totalBalance, totalFrozen, totalIncome, totalExpense] = await Promise.all([
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
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
        break;
      case 'month':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
        break;
      default:
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d %H';
    }

    const trend = await this.prisma.$queryRaw`
      SELECT
        DATE_FORMAT(create_time, ${dateFormat}) as date_key,
        SUM(CASE WHEN change_type > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN change_type < 0 THEN amount ELSE 0 END) as expense
      FROM user_balance_log
      WHERE create_time >= ${startDate} AND create_time <= ${endDate}
      GROUP BY DATE_FORMAT(create_time, ${dateFormat})
      ORDER BY date_key
    ` as any[];

    return trend;
  }

  async getBalanceRank(limit: number) {
    const rank = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        mobile: true,
        user_balance: true,
      },
      where: {
        user_balance: {
          gt: 0,
        },
      },
      orderBy: {
        user_balance: 'desc',
      },
      take: limit,
    });

    return rank;
  }

  async getFlowDetail(filter: any) {
    const { start_date, end_date, type, page, size } = filter;

    const where: any = {};
    if (start_date && end_date) {
      where.create_time = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    }
    if (type) {
      where.change_type = parseInt(type);
    }

    const skip = (page - 1) * size;

    const [records, total] = await Promise.all([
      this.prisma.userBalanceLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              mobile: true,
            },
          },
        },
        skip,
        take: size,
        orderBy: { create_time: 'desc' },
      }),
      this.prisma.userBalanceLog.count({ where }),
    ]);

    return {
      records,
      total,
    };
  }

  private async getTotalBalance(): Promise<number> {
    const result = await this.prisma.user.aggregate({
      _sum: {
        user_balance: true,
      },
    });
    return result._sum.user_balance || 0;
  }

  private async getTotalFrozen(): Promise<number> {
    const result = await this.prisma.user.aggregate({
      _sum: {
        frozen_balance: true,
      },
    });
    return result._sum.frozen_balance || 0;
  }

  private async getTotalIncome(startDate?: string, endDate?: string): Promise<number> {
    const where: any = { change_type: { gt: 0 } };
    if (startDate && endDate) {
      where.create_time = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const result = await this.prisma.userBalanceLog.aggregate({
      _sum: {
        amount: true,
      },
      where,
    });
    return result._sum.amount || 0;
  }

  private async getTotalExpense(startDate?: string, endDate?: string): Promise<number> {
    const where: any = { change_type: { lt: 0 } };
    if (startDate && endDate) {
      where.create_time = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const result = await this.prisma.userBalanceLog.aggregate({
      _sum: {
        amount: true,
      },
      where,
    });
    return Math.abs(result._sum.amount || 0);
  }

  private async getAccountDistribution() {
    const distribution = await this.prisma.$queryRaw`
      SELECT
        CASE
          WHEN user_balance = 0 THEN '0'
          WHEN user_balance BETWEEN 1 AND 100 THEN '1-100'
          WHEN user_balance BETWEEN 101 AND 1000 THEN '101-1000'
          WHEN user_balance BETWEEN 1001 AND 10000 THEN '1001-10000'
          ELSE '10000+'
        END as range,
        COUNT(*) as count
      FROM user
      GROUP BY range
      ORDER BY range
    ` as any[];

    return distribution;
  }

  private async getRecentFlows() {
    return this.prisma.userBalanceLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mobile: true,
          },
        },
      },
      orderBy: { create_time: 'desc' },
      take: 10,
    });
  }

  private async getPeriodStats(startDate: Date, endDate: Date) {
    const [income, expense, count] = await Promise.all([
      this.getTotalIncome(startDate.toISOString(), endDate.toISOString()),
      this.getTotalExpense(startDate.toISOString(), endDate.toISOString()),
      this.prisma.userBalanceLog.count({
        where: {
          create_time: {
            gte: startDate,
            lte: endDate,
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