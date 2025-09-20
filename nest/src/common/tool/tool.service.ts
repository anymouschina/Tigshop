import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@Injectable()
export class ToolService {
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

    return await this.prisma.tool.findMany({
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

    return await this.prisma.tool.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.tool.findUnique({
      where: { id },
    });
  }

  async createTool(createData: CreateToolDto) {
    try {
      const result = await this.prisma.tool.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('创建通用工具失败:', error);
      return null;
    }
  }

  async updateTool(id: number, updateData: UpdateToolDto) {
    try {
      const result = await this.prisma.tool.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('更新通用工具失败:', error);
      return null;
    }
  }

  async deleteTool(id: number) {
    try {
      await this.prisma.tool.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('删除通用工具失败:', error);
      return false;
    }
  }

  async batchDeleteTool(ids: number[]) {
    try {
      await this.prisma.tool.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('批量删除通用工具失败:', error);
      return false;
    }
  }

  async getToolStatistics() {
    try {
      const total = await this.prisma.tool.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.tool.count({
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
      console.error('获取通用工具统计失败:', error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}