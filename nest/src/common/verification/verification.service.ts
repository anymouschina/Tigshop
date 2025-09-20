import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateVerificationDto, UpdateVerificationDto } from './dto/verification.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@Injectable()
export class VerificationService {
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

    return await this.prisma.verification.findMany({
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

    return await this.prisma.verification.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.verification.findUnique({
      where: { id },
    });
  }

  async createVerification(createData: CreateVerificationDto) {
    try {
      const result = await this.prisma.verification.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('创建验证码失败:', error);
      return null;
    }
  }

  async updateVerification(id: number, updateData: UpdateVerificationDto) {
    try {
      const result = await this.prisma.verification.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('更新验证码失败:', error);
      return null;
    }
  }

  async deleteVerification(id: number) {
    try {
      await this.prisma.verification.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('删除验证码失败:', error);
      return false;
    }
  }

  async batchDeleteVerification(ids: number[]) {
    try {
      await this.prisma.verification.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('批量删除验证码失败:', error);
      return false;
    }
  }

  async getVerificationStatistics() {
    try {
      const total = await this.prisma.verification.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.verification.count({
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
      console.error('获取验证码统计失败:', error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}