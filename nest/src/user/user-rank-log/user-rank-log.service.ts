import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateUserRankLogDto, UpdateUserRankLogDto } from './dto/user-rank-log.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@Injectable()
export class UserRankLogService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { keyword, page, size, sort_field, sort_order } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
      ];
    }

    const orderBy: any = {};
    if (sort_field) {
      orderBy[sort_field] = sort_order || 'desc';
    } else {
      orderBy.id = 'desc';
    }

    const skip = (page - 1) * size;

    return await this.prisma.user_rank_log.findMany({
      where,
      orderBy,
      skip,
      take: size,
    });
  }

  async getFilterCount(filter: any) {
    const { keyword } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
      ];
    }

    return await this.prisma.user_rank_log.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.user_rank_log.findUnique({
      where: { id },
    });
  }

  async createUserRankLog(createData: CreateUserRankLogDto) {
    try {
      const result = await this.prisma.user_rank_log.create({
        data: {
          ...createData,
          change_time: Math.floor(Date.now() / 1000),
        },
      });
      return result;
    } catch (error) {
      console.error('创建用户等级日志失败:', error);
      return null;
    }
  }

  async updateUserRankLog(id: number, updateData: UpdateUserRankLogDto) {
    try {
      const result = await this.prisma.user_rank_log.update({
        where: { id },
        data: {
          ...updateData,
          change_time: Math.floor(Date.now() / 1000),
        },
      });
      return result;
    } catch (error) {
      console.error('更新用户等级日志失败:', error);
      return null;
    }
  }

  async deleteUserRankLog(id: number) {
    try {
      await this.prisma.user_rank_log.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('删除用户等级日志失败:', error);
      return false;
    }
  }

  async batchDeleteUserRankLog(ids: number[]) {
    try {
      await this.prisma.user_rank_log.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('批量删除用户等级日志失败:', error);
      return false;
    }
  }

  async getUserRankLogStatistics() {
    try {
      const total = await this.prisma.user_rank_log.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.user_rank_log.count({
        where: {
          change_time: {
            gte: Math.floor(today.getTime() / 1000),
          },
        },
      });

      return {
        total,
        today_count: todayCount,
      };
    } catch (error) {
      console.error('获取用户等级日志统计失败:', error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
