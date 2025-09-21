// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import {
  CreateProductAttributesTplDto,
  UpdateProductAttributesTplDto,
} from "./dto/product-attributes-tpl.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ProductAttributesTplService {
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

    return await this.prisma.product_attributes_tpl.findMany({
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

    return await this.prisma.product_attributes_tpl.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.product_attributes_tpl.findUnique({
      where: { id },
    });
  }

  async createProductAttributesTpl(createData: CreateProductAttributesTplDto) {
    try {
      const result = await this.prisma.product_attributes_tpl.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("创建产品属性模板失败:", error);
      return null;
    }
  }

  async updateProductAttributesTpl(
    id: number,
    updateData: UpdateProductAttributesTplDto,
  ) {
    try {
      const result = await this.prisma.product_attributes_tpl.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("更新产品属性模板失败:", error);
      return null;
    }
  }

  async deleteProductAttributesTpl(id: number) {
    try {
      await this.prisma.product_attributes_tpl.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("删除产品属性模板失败:", error);
      return false;
    }
  }

  async batchDeleteProductAttributesTpl(ids: number[]) {
    try {
      await this.prisma.product_attributes_tpl.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error("批量删除产品属性模板失败:", error);
      return false;
    }
  }

  async getProductAttributesTplStatistics() {
    try {
      const total = await this.prisma.product_attributes_tpl.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.product_attributes_tpl.count({
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
      console.error("获取产品属性模板统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
