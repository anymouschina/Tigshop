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
    const resolvedSortField =
      sortFieldMap[sort_field] || sort_field || "product_service_id";
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
      where.OR = [{ product_service_name: { contains: keyword } }];
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
      const name =
        (createData as any).product_service_name ??
        (createData as any).productServiceName ??
        (createData as any).name ??
        "";
      const desc =
        (createData as any).product_service_desc ??
        (createData as any).productServiceDesc ??
        (createData as any).desc ??
        "";
      const icon =
        (createData as any).ico_img ??
        (createData as any).icoImg ??
        (createData as any).icon ??
        "";
      const sortOrderRaw =
        (createData as any).sort_order ?? (createData as any).sortOrder ?? 50;
      const sortOrder =
        typeof sortOrderRaw === "string"
          ? parseInt(sortOrderRaw, 10)
          : sortOrderRaw;
      let defaultOnRaw =
        (createData as any).default_on ?? (createData as any).defaultOn ?? 0;
      if (typeof defaultOnRaw === "string") {
        defaultOnRaw =
          defaultOnRaw === "1" || defaultOnRaw.toLowerCase() === "true" ? 1 : 0;
      } else {
        defaultOnRaw = defaultOnRaw ? 1 : 0;
      }
      const shopId =
        (createData as any).shop_id ?? (createData as any).shopId ?? 0;

      const result = await this.prisma.product_services.create({
        data: {
          product_service_name: name,
          product_service_desc: desc,
          ico_img: icon,
          sort_order: Number.isFinite(sortOrder) ? sortOrder : 50,
          default_on: defaultOnRaw,
          shop_id: shopId,
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
          ...((updateData as any).product_service_name !== undefined && {
            product_service_name: (updateData as any).product_service_name,
          }),
          ...((updateData as any).productServiceName !== undefined && {
            product_service_name: (updateData as any).productServiceName,
          }),
          ...((updateData as any).name !== undefined && {
            product_service_name: (updateData as any).name,
          }),
          ...((updateData as any).product_service_desc !== undefined && {
            product_service_desc: (updateData as any).product_service_desc,
          }),
          ...((updateData as any).productServiceDesc !== undefined && {
            product_service_desc: (updateData as any).productServiceDesc,
          }),
          ...((updateData as any).desc !== undefined && {
            product_service_desc: (updateData as any).desc,
          }),
          ...((updateData as any).ico_img !== undefined && {
            ico_img: (updateData as any).ico_img,
          }),
          ...((updateData as any).icoImg !== undefined && {
            ico_img: (updateData as any).icoImg,
          }),
          ...((updateData as any).icon !== undefined && {
            ico_img: (updateData as any).icon,
          }),
          ...((updateData as any).sort_order !== undefined && {
            sort_order: (updateData as any).sort_order,
          }),
          ...((updateData as any).sortOrder !== undefined && {
            sort_order:
              typeof (updateData as any).sortOrder === "string"
                ? parseInt((updateData as any).sortOrder, 10)
                : (updateData as any).sortOrder,
          }),
          ...((updateData as any).default_on !== undefined && {
            default_on: (updateData as any).default_on,
          }),
          ...((updateData as any).defaultOn !== undefined && {
            default_on:
              typeof (updateData as any).defaultOn === "string"
                ? (updateData as any).defaultOn === "1" ||
                  String((updateData as any).defaultOn).toLowerCase() === "true"
                  ? 1
                  : 0
                : (updateData as any).defaultOn
                  ? 1
                  : 0,
          }),
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

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const allowed = [
      "product_service_name",
      "product_service_desc",
      "ico_img",
      "sort_order",
      "default_on",
    ];
    if (!allowed.includes(field)) {
      throw new Error("不支持的字段");
    }

    await this.prisma.product_services.update({
      where: { product_service_id: id },
      data: { [field]: value },
    });
    return true;
  }
}
