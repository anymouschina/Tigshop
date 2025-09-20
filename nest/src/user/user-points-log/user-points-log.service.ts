// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateUserPointsLogDto } from './dto/user-points-log.dto';

@Injectable()
export class UserPointsLogService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const { page, size, sort_field, sort_order, keyword } = filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    const where = keyword ? {
      OR: [
        { user: { username: { contains: keyword } } },
        { user: { mobile: { contains: keyword } } },
        { user: { email: { contains: keyword } } },
        { remark: { contains: keyword } },
      ],
    } : {};

    const records = await (this.prisma as any).user_points_log.findMany({
      where,
      skip,
      take: size,
      orderBy,
    });

    return records;
  }

  async getFilterCount(filter: any): Promise<number> {
    const { page, size, sort_field, sort_order, keyword } = filter;

    const where = keyword ? {
      OR: [
        { user: { username: { contains: keyword } } },
        { user: { mobile: { contains: keyword } } },
        { user: { email: { contains: keyword } } },
        { remark: { contains: keyword } },
      ],
    } : {};

    return (this.prisma as any).user_points_log.count({ where });
  }

  async getUserById(userId: number) {
    const user = await (this.prisma as any).user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        points: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  async deleteUserPointsLog(id: number) {
    return (this.prisma as any).user_points_log.delete({
      where: { log_id: id },
    });
  }

  async batchDeleteUserPointsLog(ids: number[]) {
    return (this.prisma as any).user_points_log.deleteMany({
      where: { log_id: { in: ids } },
    });
  }

  async createUserPointsLog(createData: CreateUserPointsLogDto) {
    const { user_id, points, type, remark } = createData;

    // 开启事务
    const result = await this.prisma.$transaction(async (prisma) => {
      // 更新用户积分
      await (prisma as any).user.update({
        where: { user_id },
        data: {
          points: { increment: points },
        },
      });

      // 创建积分日志
      const pointsLog = await (prisma as any).user_points_log.create({
        data: {
          user_id,
          points,
          change_type: type,
          change_desc: remark,
          change_time: Math.floor(Date.now() / 1000),
        },
      });

      return pointsLog;
    });

    return result;
  }

  async getDetail(id: number) {
    const item = await (this.prisma as any).user_points_log.findUnique({
      where: { log_id: id },
    });

    if (!item) {
      throw new Error('积分日志不存在');
    }

    return item;
  }

  async getPointsSummary(filter: any) {
    const { start_date, end_date, user_id } = filter;

    const where: any = {};
    if (start_date && end_date) {
      where.change_time = {
        gte: Math.floor(new Date(start_date).getTime() / 1000),
        lte: Math.floor(new Date(end_date).getTime() / 1000),
      };
    }
    if (user_id) {
      where.user_id = user_id;
    }

    const summary = await (this.prisma as any).user_points_log.groupBy({
      by: ['change_type'],
      where,
      _sum: {
        points: true,
      },
      _count: {
        points: true,
      },
    });

    return summary;
  }
}
