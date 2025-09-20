import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateAdminAccountDto, UpdateAdminAccountDto } from './dto/admin-account.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@Injectable()
export class AdminAccountService {
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

    return await this.prisma.admin_account.findMany({
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

    return await this.prisma.admin_account.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.admin_account.findUnique({
      where: { id },
    });
  }

  async createAdminAccount(createData: CreateAdminAccountDto) {
    try {
      const result = await this.prisma.admin_account.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('创建管理员账户失败:', error);
      return null;
    }
  }

  async updateAdminAccount(id: number, updateData: UpdateAdminAccountDto) {
    try {
      const result = await this.prisma.admin_account.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('更新管理员账户失败:', error);
      return null;
    }
  }

  async deleteAdminAccount(id: number) {
    try {
      await this.prisma.admin_account.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('删除管理员账户失败:', error);
      return false;
    }
  }

  async batchDeleteAdminAccount(ids: number[]) {
    try {
      await this.prisma.admin_account.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('批量删除管理员账户失败:', error);
      return false;
    }
  }

  async getAdminAccountStatistics() {
    try {
      const total = await this.prisma.admin_account.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.admin_account.count({
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
      console.error('获取管理员账户统计失败:', error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}