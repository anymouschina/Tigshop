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

    const records = await this.prisma.userPointsLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mobile: true,
            email: true,
          },
        },
      },
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

    return this.prisma.userPointsLog.count({ where });
  }

  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
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
    return this.prisma.userPointsLog.delete({
      where: { log_id: id },
    });
  }

  async batchDeleteUserPointsLog(ids: number[]) {
    return this.prisma.userPointsLog.deleteMany({
      where: { log_id: { in: ids } },
    });
  }

  async createUserPointsLog(createData: CreateUserPointsLogDto) {
    const { user_id, points, type, remark } = createData;

    // 开启事务
    const result = await this.prisma.$transaction(async (prisma) => {
      // 更新用户积分
      const updatedUser = await prisma.user.update({
        where: { id: user_id },
        data: {
          points: {
            increment: points,
          },
        },
      });

      // 创建积分日志
      const pointsLog = await prisma.userPointsLog.create({
        data: {
          user_id,
          points,
          type,
          remark,
          create_time: new Date(),
        },
      });

      return pointsLog;
    });

    return result;
  }

  async getDetail(id: number) {
    const item = await this.prisma.userPointsLog.findUnique({
      where: { log_id: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mobile: true,
            email: true,
          },
        },
      },
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
      where.create_time = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    }
    if (user_id) {
      where.user_id = user_id;
    }

    const summary = await this.prisma.userPointsLog.groupBy({
      by: ['type'],
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