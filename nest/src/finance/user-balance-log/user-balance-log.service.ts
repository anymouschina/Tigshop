// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  UserBalanceLogQueryDto,
  UserBalanceLogDetailDto,
  CreateUserBalanceLogDto,
  UpdateUserBalanceLogDto,
  DeleteUserBalanceLogDto,
  BatchDeleteUserBalanceLogDto,
  USER_BALANCE_LOG_TYPE,
  BALANCE_CHANGE_TYPE,
} from "./user-balance-log.dto";

@Injectable()
export class UserBalanceLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: UserBalanceLogQueryDto) {
    const {
      keyword = "",
      user_id = 0,
      order_id = 0,
      type = -1,
      change_type = -1,
      start_date = "",
      end_date = "",
      page = 1,
      size = 15,
      sort_field = "id",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [{ change_desc: { contains: keyword } }];
    }

    if (user_id > 0) {
      where.user_id = user_id;
    }

    // user_balance_log 无 order_id 字段

    if (type >= 0) {
      where.type = type;
    }

    if (change_type >= 0) {
      where.change_type = change_type;
    }

    if (start_date || end_date) {
      where.change_time = {};
      if (start_date)
        where.change_time.gte = Math.floor(
          new Date(start_date).getTime() / 1000,
        );
      if (end_date)
        where.change_time.lte = Math.floor(new Date(end_date).getTime() / 1000);
    }

    const sortKey = sort_field === "id" ? "log_id" : sort_field;
    const orderBy: any = {};
    orderBy[sortKey] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.user_balance_log.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.user_balance_log.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const userBalanceLog = await this.prisma.user_balance_log.findUnique({
      where: { log_id: Number(id) },
    });

    if (!userBalanceLog) {
      throw new Error("余额记录不存在");
    }

    return userBalanceLog;
  }

  async create(data: CreateUserBalanceLogDto) {
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { user_id: data.user_id },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 检查订单是否存在（如果提供了）
    if (data.order_id > 0) {
      const order = await this.prisma.order.findUnique({
        where: { order_id: data.order_id },
      });

      if (!order) {
        throw new Error("订单不存在");
      }
    }

    // 验证余额变化
    if (data.change_type === 1 && data.amount > user.balance) {
      throw new Error("余额不足");
    }

    const userBalanceLog = await this.prisma.user_balance_log.create({
      data: {
        user_id: data.user_id,
        balance: data.balance ?? user.balance,
        frozen_balance: data.frozen_balance ?? 0,
        new_balance: data.new_balance ?? user.balance,
        new_frozen_balance: data.new_frozen_balance ?? 0,
        change_time: Math.floor(Date.now() / 1000),
        change_desc: data.description ?? "",
        change_type: data.change_type,
      },
    });

    return userBalanceLog;
  }

  async update(data: UpdateUserBalanceLogDto) {
    const userBalanceLog = await this.prisma.user_balance_log.findUnique({
      where: { log_id: Number(data.id) },
    });

    if (!userBalanceLog) {
      throw new Error("余额记录不存在");
    }

    const updateData: any = {};
    if (data.balance !== undefined) updateData.balance = data.balance;
    if (data.frozen_balance !== undefined)
      updateData.frozen_balance = data.frozen_balance;
    if (data.new_balance !== undefined)
      updateData.new_balance = data.new_balance;
    if (data.new_frozen_balance !== undefined)
      updateData.new_frozen_balance = data.new_frozen_balance;
    if (data.description !== undefined)
      updateData.change_desc = data.description;
    if (data.change_type !== undefined)
      updateData.change_type = data.change_type;

    // 移除id字段，不允许更新ID
    delete (updateData as any).id;

    const updatedUserBalanceLog = await this.prisma.user_balance_log.update({
      where: { log_id: Number(data.id) },
      data: updateData,
    });

    return updatedUserBalanceLog;
  }

  async remove(id: number) {
    const userBalanceLog = await this.prisma.user_balance_log.findUnique({
      where: { log_id: Number(id) },
    });

    if (!userBalanceLog) {
      throw new Error("余额记录不存在");
    }

    await this.prisma.user_balance_log.delete({
      where: { log_id: Number(id) },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    await this.prisma.user_balance_log.deleteMany({
      where: {
        log_id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getUserBalanceLogs(userId: number, type?: number) {
    const where: any = { user_id: userId };
    if (type !== undefined && type >= 0) {
      where.type = type;
    }

    return await this.prisma.user_balance_log.findMany({
      where,
      orderBy: { change_time: "desc" },
    });
  }

  async getBalanceStats(userId?: number) {
    const where: any = {};
    if (userId && userId > 0) {
      where.user_id = userId;
    }

    const result = await this.prisma.user_balance_log.groupBy({
      by: ["type", "change_type"],
      where,
      _sum: {
        balance: true,
      },
      _count: {
        _all: true,
      },
    });

    const stats = {};
    for (let type = 0; type <= 5; type++) {
      stats[type] = {
        increase: { total: 0, count: 0 },
        decrease: { total: 0, count: 0 },
        freeze: { total: 0, count: 0 },
      };
    }

    result.forEach((stat) => {
      if (stat.change_type === 0) {
        stats[stat.type].increase = {
          total: stat._sum.balance || 0, // 近似：以 balance 聚合表示
          count: stat._count._all || 0,
        };
      } else if (stat.change_type === 1) {
        stats[stat.type].decrease = {
          total: Math.abs(stat._sum.balance || 0),
          count: stat._count._all || 0,
        };
      } else if (stat.change_type === 2) {
        stats[stat.type].freeze = {
          total: stat._sum.balance || 0,
          count: stat._count._all || 0,
        };
      }
    });

    return stats;
  }

  async getMonthlyBalanceStats(userId?: number, year?: number) {
    const where: any = {};
    if (userId && userId > 0) {
      where.user_id = userId;
    }

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);
      where.change_time = {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      };
    }

    const result = await this.prisma.user_balance_log.groupBy({
      by: ["type", "change_type"],
      where,
      _sum: {
        balance: true,
      },
      _count: {
        _all: true,
      },
    });

    return result;
  }

  async getTopBalanceUsers(limit: number = 10) {
    const users = await this.prisma.user.findMany({
      select: {
        user_id: true,
        nickname: true,
        avatar: true,
        mobile: true,
        balance: true,
      },
      orderBy: { balance: "desc" },
      take: limit,
    });

    return users;
  }

  async createBalanceLog(
    userId: number,
    amount: number,
    type: number,
    changeType: number,
    description: string = "",
    orderId?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    let newBalance = user.balance;

    if (changeType === 0) {
      // 增加
      newBalance += amount;
    } else if (changeType === 1) {
      // 减少
      if (amount > user.balance) {
        throw new Error("余额不足");
      }
      newBalance -= amount;
    } else if (changeType === 2) {
      // 冻结
      if (amount > user.balance) {
        throw new Error("余额不足");
      }
      // 冻结逻辑在这里处理
    }

    // 创建余额变更记录
    const balanceLog = await this.prisma.userBalanceLog.create({
      data: {
        user_id: userId,
        type,
        change_type: changeType,
        amount,
        balance: newBalance,
        description,
        order_id: orderId || 0,
        create_time: new Date(),
      },
    });

    // 更新用户余额
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { balance: newBalance },
    });

    return balanceLog;
  }
}
