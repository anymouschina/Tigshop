// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateProductGroupDto,
  UpdateProductGroupDto,
} from "./dto/product-group.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ProductGroupService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { keyword, page, size, sort_field, sort_order } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [{ name: { contains: keyword } }];
    }

    const orderBy: any = {};
    if (sort_field) {
      orderBy[sort_field] = sort_order || "desc";
    } else {
      orderBy.id = "desc";
    }

    const skip = (page - 1) * size;

    return await this.prisma.product_group.findMany({
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
      where.OR = [{ name: { contains: keyword } }];
    }

    return await this.prisma.product_group.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.product_group.findUnique({
      where: { id },
    });
  }

  async createProductGroup(createData: CreateProductGroupDto) {
    try {
      const result = await this.prisma.product_group.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("创建产品分组失败:", error);
      return null;
    }
  }

  async updateProductGroup(id: number, updateData: UpdateProductGroupDto) {
    try {
      const result = await this.prisma.product_group.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("更新产品分组失败:", error);
      return null;
    }
  }

  async deleteProductGroup(id: number) {
    try {
      await this.prisma.product_group.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("删除产品分组失败:", error);
      return false;
    }
  }

  async batchDeleteProductGroup(ids: number[]) {
    try {
      await this.prisma.product_group.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error("批量删除产品分组失败:", error);
      return false;
    }
  }

  async getProductGroupStatistics() {
    try {
      const total = await this.prisma.product_group.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.product_group.count({
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
      console.error("获取产品分组统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
