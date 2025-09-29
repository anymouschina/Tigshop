// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateProductServicesDto,
  UpdateProductServicesDto,
} from "./dto/product-services.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ProductServicesService {
  private readonly logger = new Logger(ProductServicesService.name);
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { keyword, page, size, sort_field, sort_order } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [{ product_service_name: { contains: keyword } }];
    }

    const sortFieldMap: Record<string, string> = { id: "product_service_id" };
    const resolvedSortField = sortFieldMap[sort_field] || sort_field || "product_service_id";
    const orderBy: any = { [resolvedSortField]: sort_order || "desc" };

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
      where: { product_service_id: id },
    });
  }

  async createProductServices(createData: CreateProductServicesDto) {
    try {
      const result = await this.prisma.product_services.create({
        data: {
          product_service_name: (createData as any).product_service_name || (createData as any).name || "",
          product_service_desc: (createData as any).product_service_desc || (createData as any).desc || "",
          ico_img: (createData as any).ico_img || (createData as any).icon || "",
          sort_order: (createData as any).sort_order ?? 50,
          default_on: (createData as any).default_on ?? 0,
          shop_id: (createData as any).shop_id || 0,
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
        where: { product_service_id: id },
        data: {
          ...(updateData as any).product_service_name !== undefined && { product_service_name: (updateData as any).product_service_name },
          ...(updateData as any).name !== undefined && { product_service_name: (updateData as any).name },
          ...(updateData as any).product_service_desc !== undefined && { product_service_desc: (updateData as any).product_service_desc },
          ...(updateData as any).desc !== undefined && { product_service_desc: (updateData as any).desc },
          ...(updateData as any).ico_img !== undefined && { ico_img: (updateData as any).ico_img },
          ...(updateData as any).icon !== undefined && { ico_img: (updateData as any).icon },
          ...(updateData as any).sort_order !== undefined && { sort_order: (updateData as any).sort_order },
          ...(updateData as any).default_on !== undefined && { default_on: (updateData as any).default_on },
          ...(updateData as any).shop_id !== undefined && { shop_id: (updateData as any).shop_id },
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
        where: { product_service_id: id },
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
          product_service_id: {
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
      // product_services 表没有 created_at 字段，返回总数即可
      return { total, today_count: 0 };
    } catch (error) {
      this.logger.debug("获取产品服务统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
