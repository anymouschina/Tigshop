// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsLogQueryDto } from "./dto/user-points-log.dto";

@Injectable()
export class UserPointsLogService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPoints(userId: number) {
    const userPoints = await this.prisma.user_points.findUnique({
      where: { user_id: userId },
    });

    if (!userPoints) {
      throw new NotFoundException("用户积分账户不存在");
    }

    return {
      points: userPoints.points,
      frozen_points: userPoints.frozen_points,
    };
  }

  async getPointsLog(userId: number, queryDto: PointsLogQueryDto) {
    const {
      page = 1,
      size = 10,
      type = "all",
      log_type,
      start_date,
      end_date,
    } = queryDto;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };

    if (type === "income") {
      where.points = { gt: 0 };
    } else if (type === "expense") {
      where.points = { lt: 0 };
    }

    if (log_type) {
      where.log_type = log_type;
    }

    if (start_date) {
      where.add_time = { gte: new Date(start_date).getTime() / 1000 };
    }

    if (end_date) {
      where.add_time = {
        ...where.add_time,
        lte: new Date(end_date).getTime() / 1000,
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.user_points_log.findMany({
        where,
        skip,
        take: size,
        orderBy: { add_time: "desc" },
        select: {
          log_id: true,
          points: true,
          log_type: true,
          description: true,
          add_time: true,
          related_data: true,
        },
      }),
      this.prisma.user_points_log.count({ where }),
    ]);

    return {
      list: logs,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getPointsStatistics(userId: number) {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [totalPoints, thisMonthPoints, lastMonthPoints, todayPoints] =
      await Promise.all([
        this.prisma.user_points_log.aggregate({
          where: { user_id: userId },
          _sum: { points: true },
        }),
        this.prisma.user_points_log.aggregate({
          where: {
            user_id: userId,
            add_time: { gte: thisMonth.getTime() / 1000 },
          },
          _sum: { points: true },
        }),
        this.prisma.user_points_log.aggregate({
          where: {
            user_id: userId,
            add_time: {
              gte: lastMonth.getTime() / 1000,
              lt: thisMonth.getTime() / 1000,
            },
          },
          _sum: { points: true },
        }),
        this.prisma.user_points_log.aggregate({
          where: {
            user_id: userId,
            add_time: {
              gte: today.setHours(0, 0, 0, 0) / 1000,
            },
          },
          _sum: { points: true },
        }),
      ]);

    // 按类型统计
    const typeStats = await this.prisma.user_points_log.groupBy({
      by: ["log_type"],
      where: { user_id: userId },
      _sum: { points: true },
      _count: true,
    });

    const typeDistribution = typeStats.reduce((acc, stat) => {
      acc[stat.log_type] = {
        total_points: stat._sum.points || 0,
        count: stat._count,
      };
      return acc;
    }, {});

    return {
      current_balance: (await this.getUserPoints(userId)).points,
      total_earned: totalPoints._sum.points || 0,
      this_month_earned: thisMonthPoints._sum.points || 0,
      last_month_earned: lastMonthPoints._sum.points || 0,
      today_earned: todayPoints._sum.points || 0,
      type_distribution: typeDistribution,
    };
  }

  async addPoints(
    userId: number,
    points: number,
    logType: string,
    description: string,
    relatedData?: any,
  ) {
    // 添加积分
    await this.prisma.user_points.update({
      where: { user_id: userId },
      data: {
        points: {
          increment: points,
        },
      },
    });

    // 记录积分日志
    const log = await this.prisma.user_points_log.create({
      data: {
        user_id: userId,
        points: points,
        log_type: logType,
        description: description,
        related_data: relatedData,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return { log_id: log.log_id };
  }

  async deductPoints(
    userId: number,
    points: number,
    logType: string,
    description: string,
    relatedData?: any,
  ) {
    // 检查积分是否足够
    const userPoints = await this.getUserPoints(userId);
    if (userPoints.points < Math.abs(points)) {
      throw new Error("积分不足");
    }

    // 扣除积分
    await this.prisma.user_points.update({
      where: { user_id: userId },
      data: {
        points: {
          increment: points, // points为负数
        },
      },
    });

    // 记录积分日志
    const log = await this.prisma.user_points_log.create({
      data: {
        user_id: userId,
        points: points, // 负数
        log_type: logType,
        description: description,
        related_data: relatedData,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return { log_id: log.log_id };
  }

  async freezePoints(
    userId: number,
    points: number,
    logType: string,
    description: string,
    relatedData?: any,
  ) {
    // 冻结积分
    await this.prisma.user_points.update({
      where: { user_id: userId },
      data: {
        points: {
          decrement: points,
        },
        frozen_points: {
          increment: points,
        },
      },
    });

    // 记录积分日志
    const log = await this.prisma.user_points_log.create({
      data: {
        user_id: userId,
        points: -points,
        log_type: logType,
        description: `${description} (冻结)`,
        related_data: relatedData,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return { log_id: log.log_id };
  }

  async unfreezePoints(
    userId: number,
    points: number,
    logType: string,
    description: string,
    relatedData?: any,
  ) {
    // 解冻积分
    await this.prisma.user_points.update({
      where: { user_id: userId },
      data: {
        points: {
          increment: points,
        },
        frozen_points: {
          decrement: points,
        },
      },
    });

    // 记录积分日志
    const log = await this.prisma.user_points_log.create({
      data: {
        user_id: userId,
        points: points,
        log_type: logType,
        description: `${description} (解冻)`,
        related_data: relatedData,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return { log_id: log.log_id };
  }

  async getPointsRanking(limit: number = 10) {
    const rankings = await this.prisma.user.findMany({
      where: { is_using: 1 },
      select: {
        user_id: true,
        username: true,
        nickname: true,
        avatar: true,
        user_points: {
          select: {
            points: true,
          },
        },
      },
      orderBy: {
        user_points: {
          points: "desc",
        },
      },
      take: limit,
    });

    return rankings.map((user, index) => ({
      rank: index + 1,
      user_id: user.user_id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      points: user.user_points?.points || 0,
    }));
  }
}
