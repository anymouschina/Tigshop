import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateProductInventoryLogDto, UpdateProductInventoryLogDto } from './dto/product-inventory-log.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@Injectable()
export class ProductInventoryLogService {
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

    return await this.prisma.product_inventory_log.findMany({
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

    return await this.prisma.product_inventory_log.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.product_inventory_log.findUnique({
      where: { id },
    });
  }

  async createProductInventoryLog(createData: CreateProductInventoryLogDto) {
    try {
      const result = await this.prisma.product_inventory_log.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('创建产品库存日志失败:', error);
      return null;
    }
  }

  async updateProductInventoryLog(id: number, updateData: UpdateProductInventoryLogDto) {
    try {
      const result = await this.prisma.product_inventory_log.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error('更新产品库存日志失败:', error);
      return null;
    }
  }

  async deleteProductInventoryLog(id: number) {
    try {
      await this.prisma.product_inventory_log.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('删除产品库存日志失败:', error);
      return false;
    }
  }

  async batchDeleteProductInventoryLog(ids: number[]) {
    try {
      await this.prisma.product_inventory_log.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('批量删除产品库存日志失败:', error);
      return false;
    }
  }

  async getProductInventoryLogStatistics() {
    try {
      const total = await this.prisma.product_inventory_log.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.product_inventory_log.count({
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
      console.error('获取产品库存日志统计失败:', error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}