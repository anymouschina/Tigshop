import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface BalanceQueryDto {
  user_id?: number;
  min_balance?: number;
  max_balance?: number;
  start_time?: string;
  end_time?: string;
  page?: number;
  size?: number;
  sort_field?: string;
  sort_order?: "asc" | "desc";
}

export interface BalanceAdjustmentDto {
  user_id: number;
  amount: number;
  change_type: number;
  description: string;
  admin_id?: number;
}

export interface BalanceStatsDto {
  start_time?: string;
  end_time?: string;
}

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: BalanceQueryDto) {
    const {
      user_id,
      min_balance,
      max_balance,
      start_time,
      end_time,
      page = 1,
      size = 10,
      sort_field = "user_id",
      sort_order = "desc",
    } = query;

    const skip = (page - 1) * size;
    const where: any = {};

    if (user_id) {
      where.user_id = user_id;
    }

    if (min_balance !== undefined || max_balance !== undefined) {
      where.balance = {};
      if (min_balance !== undefined) {
        where.balance.gte = min_balance;
      }
      if (max_balance !== undefined) {
        where.balance.lte = max_balance;
      }
    }

    if (start_time || end_time) {
      where.reg_time = {};
      if (start_time) {
        where.reg_time.gte = Math.floor(new Date(start_time).getTime() / 1000);
      }
      if (end_time) {
        where.reg_time.lte = Math.floor(new Date(end_time).getTime() / 1000);
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: {
          [sort_field]: sort_order,
        },
        skip,
        take: size,
        select: {
          user_id: true,
          username: true,
          nickname: true,
          email: true,
          mobile: true,
          balance: true,
          frozen_balance: true,
          reg_time: true,
          last_login: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        nickname: true,
        email: true,
        mobile: true,
        balance: true,
        frozen_balance: true,
        reg_time: true,
        last_login: true,
      },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 获取余额变动记录
    const balanceLogs = await this.prisma.user_balance_log.findMany({
      where: { user_id: userId },
      orderBy: { change_time: "desc" },
      take: 10,
    });

    return {
      ...user,
      balance_logs: balanceLogs,
    };
  }

  async adjustBalance(adjustmentDto: BalanceAdjustmentDto, adminId?: number) {
    const { user_id, amount, change_type, description } = adjustmentDto;

    // 验证用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { user_id },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 验证金额
    if (amount === 0) {
      throw new Error("调整金额不能为零");
    }

    // 开始事务
    const result = await this.prisma.$transaction(async (prisma) => {
      // 更新用户余额
      const updatedUser = await prisma.user.update({
        where: { user_id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // 记录余额变动日志
      const balanceLog = await prisma.user_balance_log.create({
        data: {
          user_id,
          balance: amount,
          new_balance: updatedUser.balance,
          change_time: Math.floor(Date.now() / 1000),
          change_desc: description,
          change_type,
        },
      });

      return { updatedUser, balanceLog };
    });

    this.logger.log(
      `余额调整成功: 用户ID=${user_id}, 金额=${amount}, 类型=${change_type}, 操作人=${adminId}`,
    );

    return {
      user: result.updatedUser,
      balance_log: result.balanceLog,
    };
  }

  async getBalanceLogs(userId: number, query?: any) {
    const {
      change_type,
      start_time,
      end_time,
      page = 1,
      size = 10,
    } = query || {};

    const skip = (page - 1) * size;
    const where: any = { user_id: userId };

    if (change_type !== undefined) {
      where.change_type = change_type;
    }

    if (start_time || end_time) {
      where.change_time = {};
      if (start_time) {
        where.change_time.gte = Math.floor(
          new Date(start_time).getTime() / 1000,
        );
      }
      if (end_time) {
        where.change_time.lte = Math.floor(new Date(end_time).getTime() / 1000);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.user_balance_log.findMany({
        where,
        orderBy: { change_time: "desc" },
        skip,
        take: size,
      }),
      this.prisma.user_balance_log.count({ where }),
    ]);

    return {
      items: logs,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getBalanceStats(query: BalanceStatsDto = {}) {
    const { start_time, end_time } = query;
    const where: any = {};

    if (start_time || end_time) {
      where.change_time = {};
      if (start_time) {
        where.change_time.gte = Math.floor(
          new Date(start_time).getTime() / 1000,
        );
      }
      if (end_time) {
        where.change_time.lte = Math.floor(new Date(end_time).getTime() / 1000);
      }
    }

    // 获取余额统计
    const [totalBalance, totalFrozenBalance, userCount, balanceChangeStats] =
      await Promise.all([
        this.prisma.user.aggregate({
          _sum: { balance: true },
          _count: { user_id: true },
        }),
        this.prisma.user.aggregate({
          _sum: { frozen_balance: true },
        }),
        this.prisma.user.count({
          where: { balance: { gt: 0 } },
        }),
        this.prisma.user_balance_log.groupBy({
          by: ["change_type"],
          where,
          _sum: { balance: true },
          _count: { log_id: true },
        }),
      ]);

    // 计算平均余额
    const avgBalance =
      totalBalance._count.user_id > 0
        ? Number(totalBalance._sum.balance || 0) / totalBalance._count.user_id
        : 0;

    return {
      total_balance: Number(totalBalance._sum.balance || 0),
      total_frozen_balance: Number(totalFrozenBalance._sum.frozen_balance || 0),
      total_users: totalBalance._count.user_id,
      active_users: userCount,
      balance_change_stats: balanceChangeStats,
      distribution: {
        avg_balance: avgBalance,
        total_users: totalBalance._count.user_id,
      },
    };
  }

  async getTopUsers(limit: number = 10) {
    const topUsers = await this.prisma.user.findMany({
      orderBy: { balance: "desc" },
      take: limit,
      select: {
        user_id: true,
        username: true,
        nickname: true,
        email: true,
        balance: true,
        frozen_balance: true,
        reg_time: true,
      },
    });

    return topUsers;
  }

  async freezeBalance(
    userId: number,
    amount: number,
    description: string,
    adminId?: number,
  ) {
    if (amount <= 0) {
      throw new Error("冻结金额必须大于零");
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      // 检查用户余额
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      if (Number(user.balance) < amount) {
        throw new Error("余额不足");
      }

      // 更新余额
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: {
          balance: {
            decrement: amount,
          },
          frozen_balance: {
            increment: amount,
          },
        },
      });

      // 记录余额变动
      const balanceLog = await prisma.user_balance_log.create({
        data: {
          user_id: userId,
          balance: -amount,
          frozen_balance: amount,
          new_balance: updatedUser.balance,
          new_frozen_balance: updatedUser.frozen_balance,
          change_time: Math.floor(Date.now() / 1000),
          change_desc: `冻结余额: ${description}`,
          change_type: 2, // 冻结类型
        },
      });

      return { updatedUser, balanceLog };
    });

    this.logger.log(
      `余额冻结成功: 用户ID=${userId}, 金额=${amount}, 操作人=${adminId}`,
    );

    return result;
  }

  async unfreezeBalance(
    userId: number,
    amount: number,
    description: string,
    adminId?: number,
  ) {
    if (amount <= 0) {
      throw new Error("解冻金额必须大于零");
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      // 检查用户冻结余额
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      if (Number(user.frozen_balance) < amount) {
        throw new Error("冻结余额不足");
      }

      // 更新余额
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: {
          balance: {
            increment: amount,
          },
          frozen_balance: {
            decrement: amount,
          },
        },
      });

      // 记录余额变动
      const balanceLog = await prisma.user_balance_log.create({
        data: {
          user_id: userId,
          balance: amount,
          frozen_balance: -amount,
          new_balance: updatedUser.balance,
          new_frozen_balance: updatedUser.frozen_balance,
          change_time: Math.floor(Date.now() / 1000),
          change_desc: `解冻余额: ${description}`,
          change_type: 3, // 解冻类型
        },
      });

      return { updatedUser, balanceLog };
    });

    this.logger.log(
      `余额解冻成功: 用户ID=${userId}, 金额=${amount}, 操作人=${adminId}`,
    );

    return result;
  }
}
