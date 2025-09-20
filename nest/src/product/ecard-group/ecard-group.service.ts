// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateECardGroupDto, UpdateECardGroupDto } from './dto/ecard-group.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@Injectable()
export class ECardGroupService {
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

    return await this.prisma.ecard_group.findMany({
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

    return await this.prisma.ecard_group.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.ecard_group.findUnique({
      where: { id },
    });
  }

  async createECardGroup(createData: CreateECardGroupDto) {
    try {
      const result = await this.prisma.ecard_group.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('创建电子卡券分组失败:', error);
      return null;
    }
  }

  async updateECardGroup(id: number, updateData: UpdateECardGroupDto) {
    try {
      const result = await this.prisma.ecard_group.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('更新电子卡券分组失败:', error);
      return null;
    }
  }

  async deleteECardGroup(id: number) {
    try {
      await this.prisma.ecard_group.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('删除电子卡券分组失败:', error);
      return false;
    }
  }

  async batchDeleteECardGroup(ids: number[]) {
    try {
      await this.prisma.ecard_group.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('批量删除电子卡券分组失败:', error);
      return false;
    }
  }

  async getECardGroupStatistics() {
    try {
      const total = await this.prisma.ecard_group.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.ecard_group.count({
        where: {
          created_at: {
            gte: today,
          },
        },
      });

      return {
        total,
        today_count: todayCount,
      };
    } catch (error) {
      console.error('获取电子卡券分组统计失败:', error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
