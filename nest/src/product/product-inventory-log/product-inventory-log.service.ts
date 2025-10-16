// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateProductInventoryLogDto,
  UpdateProductInventoryLogDto,
} from "./dto/product-inventory-log.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ProductInventoryLogService {
  private readonly logger = new Logger(ProductInventoryLogService.name);
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { keyword, page, size, sort_field, sort_order } = filter;

    const where: any = {};
    if (keyword) {
      // 库存日志无名称字段，这里按描述字段模糊
      where.OR = [{ desc: { contains: keyword } }];
    }

    const sortFieldMap: Record<string, string> = { id: "log_id" };
    const resolvedSortField =
      sortFieldMap[sort_field] || sort_field || "log_id";
    const orderBy: any = { [resolvedSortField]: sort_order || "desc" };

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
      where.OR = [{ desc: { contains: keyword } }];
    }

    return await this.prisma.product_inventory_log.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.product_inventory_log.findUnique({
      where: { log_id: id },
    });
  }

  async createProductInventoryLog(createData: CreateProductInventoryLogDto) {
    try {
      const result = await this.prisma.product_inventory_log.create({
        data: {
          product_id: (createData as any).product_id ?? 0,
          spec_id: (createData as any).spec_id ?? 0,
          number: (createData as any).number ?? 0,
          old_number: (createData as any).old_number ?? 0,
          type: (createData as any).type ?? 1,
          change_number: (createData as any).change_number ?? 0,
          desc: (createData as any).desc ?? "",
          shop_id: (createData as any).shop_id ?? 0,
          add_time:
            (createData as any).add_time ?? Math.floor(Date.now() / 1000),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建产品库存日志失败:", error);
      return null;
    }
  }

  async updateProductInventoryLog(
    id: number,
    updateData: UpdateProductInventoryLogDto,
  ) {
    try {
      const result = await this.prisma.product_inventory_log.update({
        where: { log_id: id },
        data: {
          ...((updateData as any).product_id !== undefined && {
            product_id: (updateData as any).product_id,
          }),
          ...((updateData as any).spec_id !== undefined && {
            spec_id: (updateData as any).spec_id,
          }),
          ...((updateData as any).number !== undefined && {
            number: (updateData as any).number,
          }),
          ...((updateData as any).old_number !== undefined && {
            old_number: (updateData as any).old_number,
          }),
          ...((updateData as any).type !== undefined && {
            type: (updateData as any).type,
          }),
          ...((updateData as any).change_number !== undefined && {
            change_number: (updateData as any).change_number,
          }),
          ...((updateData as any).desc !== undefined && {
            desc: (updateData as any).desc,
          }),
          ...((updateData as any).shop_id !== undefined && {
            shop_id: (updateData as any).shop_id,
          }),
          ...((updateData as any).add_time !== undefined && {
            add_time: (updateData as any).add_time,
          }),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新产品库存日志失败:", error);
      return null;
    }
  }

  async deleteProductInventoryLog(id: number) {
    try {
      await this.prisma.product_inventory_log.delete({
        where: { log_id: id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除产品库存日志失败:", error);
      return false;
    }
  }

  async batchDeleteProductInventoryLog(ids: number[]) {
    try {
      await this.prisma.product_inventory_log.deleteMany({
        where: {
          log_id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除产品库存日志失败:", error);
      return false;
    }
  }

  async getProductInventoryLogStatistics() {
    try {
      const total = await this.prisma.product_inventory_log.count();
      // 表中无 created_at 字段，这里不提供今日统计
      return {
        total,
        today_count: 0,
      };
    } catch (error) {
      this.logger.debug("获取产品库存日志统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
