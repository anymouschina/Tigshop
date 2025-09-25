// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateProductServicesDto,
  UpdateProductServicesDto,
} from "./dto/product-services.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ProductServicesService {
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

    return await this.prisma.product_services.findMany({
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

    return await this.prisma.product_services.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.product_services.findUnique({
      where: { id },
    });
  }

  async createProductServices(createData: CreateProductServicesDto) {
    try {
      const result = await this.prisma.product_services.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建产品服务失败:", error);
      return null;
    }
  }

  async updateProductServices(
    id: number,
    updateData: UpdateProductServicesDto,
  ) {
    try {
      const result = await this.prisma.product_services.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新产品服务失败:", error);
      return null;
    }
  }

  async deleteProductServices(id: number) {
    try {
      await this.prisma.product_services.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除产品服务失败:", error);
      return false;
    }
  }

  async batchDeleteProductServices(ids: number[]) {
    try {
      await this.prisma.product_services.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除产品服务失败:", error);
      return false;
    }
  }

  async getProductServicesStatistics() {
    try {
      const total = await this.prisma.product_services.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.product_services.count({
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
      this.logger.debug("获取产品服务统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
