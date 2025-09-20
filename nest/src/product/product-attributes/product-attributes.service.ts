// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/services/prisma.service";
import {
  CreateProductAttributesDto,
  UpdateProductAttributesDto,
} from "./dto/product-attributes.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ProductAttributesService {
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

    return await this.prisma.product_attributes.findMany({
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

    return await this.prisma.product_attributes.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.product_attributes.findUnique({
      where: { id },
    });
  }

  async createProductAttributes(createData: CreateProductAttributesDto) {
    try {
      const result = await this.prisma.product_attributes.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("创建产品属性失败:", error);
      return null;
    }
  }

  async updateProductAttributes(
    id: number,
    updateData: UpdateProductAttributesDto,
  ) {
    try {
      const result = await this.prisma.product_attributes.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("更新产品属性失败:", error);
      return null;
    }
  }

  async deleteProductAttributes(id: number) {
    try {
      await this.prisma.product_attributes.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("删除产品属性失败:", error);
      return false;
    }
  }

  async batchDeleteProductAttributes(ids: number[]) {
    try {
      await this.prisma.product_attributes.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error("批量删除产品属性失败:", error);
      return false;
    }
  }

  async getProductAttributesStatistics() {
    try {
      const total = await this.prisma.product_attributes.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.product_attributes.count({
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
      console.error("获取产品属性统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
