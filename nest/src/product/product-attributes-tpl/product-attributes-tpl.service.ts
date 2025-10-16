// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateProductAttributesTplDto,
  UpdateProductAttributesTplDto,
} from "./dto/product-attributes-tpl.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ProductAttributesTplService {
  private readonly logger = new Logger(ProductAttributesTplService.name);
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { keyword, page, size, sort_field, sort_order } = filter;

    // 真实字段：tpl_id, tpl_name, tpl_data, shop_id
    const where: any = {};
    if (keyword) {
      where.OR = [{ tpl_name: { contains: keyword } }];
    }

    // 将通用的 id 映射为实际主键字段 tpl_id
    const sortFieldMap: Record<string, string> = { id: "tpl_id" };
    const resolvedSortField =
      sortFieldMap[sort_field] || sort_field || "tpl_id";
    const orderBy: any = { [resolvedSortField]: sort_order || "desc" };

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
      where.OR = [{ tpl_name: { contains: keyword } }];
    }

    return await this.prisma.product_attributes_tpl.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.product_attributes_tpl.findUnique({
      where: { tpl_id: id },
    });
  }

  async createProductAttributesTpl(createData: CreateProductAttributesTplDto) {
    try {
      const name =
        (createData as any).tpl_name ??
        (createData as any).tplName ??
        (createData as any).name ??
        "";
      const rawTplData =
        (createData as any).tpl_data ??
        (createData as any).tplData ??
        (createData as any).data ??
        null;
      const tplData =
        typeof rawTplData === "string"
          ? rawTplData
          : JSON.stringify(rawTplData ?? {});
      const shopId =
        (createData as any).shop_id ?? (createData as any).shopId ?? 0;

      const result = await this.prisma.product_attributes_tpl.create({
        data: {
          tpl_name: name,
          tpl_data: tplData,
          shop_id: shopId,
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建产品属性模板失败:", error);
      return null;
    }
  }

  async updateProductAttributesTpl(
    id: number,
    updateData: UpdateProductAttributesTplDto,
  ) {
    try {
      const rawTplData =
        (updateData as any).tpl_data ??
        (updateData as any).tplData ??
        (updateData as any).data;
      const tplData =
        rawTplData === undefined
          ? undefined
          : typeof rawTplData === "string"
            ? rawTplData
            : JSON.stringify(rawTplData ?? {});

      const result = await this.prisma.product_attributes_tpl.update({
        where: { tpl_id: id },
        data: {
          ...((updateData as any).tpl_name !== undefined && {
            tpl_name: (updateData as any).tpl_name,
          }),
          ...((updateData as any).tplName !== undefined && {
            tpl_name: (updateData as any).tplName,
          }),
          ...((updateData as any).name !== undefined && {
            tpl_name: (updateData as any).name,
          }),
          ...(tplData !== undefined && { tpl_data: tplData }),
          ...((updateData as any).shop_id !== undefined && {
            shop_id: (updateData as any).shop_id,
          }),
          ...((updateData as any).shopId !== undefined && {
            shop_id: (updateData as any).shopId,
          }),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新产品属性模板失败:", error);
      return null;
    }
  }

  async deleteProductAttributesTpl(id: number) {
    try {
      await this.prisma.product_attributes_tpl.delete({
        where: { tpl_id: id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除产品属性模板失败:", error);
      return false;
    }
  }

  async batchDeleteProductAttributesTpl(ids: number[]) {
    try {
      await this.prisma.product_attributes_tpl.deleteMany({
        where: {
          tpl_id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除产品属性模板失败:", error);
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
      this.logger.debug("获取产品属性模板统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
