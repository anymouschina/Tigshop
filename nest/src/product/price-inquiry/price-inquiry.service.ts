// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreatePriceInquiryDto,
  UpdatePriceInquiryDto,
} from "./dto/price-inquiry.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class PriceInquiryService {
  private readonly logger = new Logger(PriceInquiryService.name);
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { keyword, status, page, size, sort_field, sort_order } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { customer_name: { contains: keyword } },
        { product_name: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }
    if (status !== undefined && status !== "") {
      where.status = status;
    }

    const sortFieldMap: Record<string, string> = { id: "id" };
    const resolvedSortField = sortFieldMap[sort_field] || sort_field || "id";
    const orderBy: any = { [resolvedSortField]: sort_order || "desc" };

    const skip = (page - 1) * size;

    // Prisma 模型为 price_inquiry（蛇形表名）
    return await this.prisma.price_inquiry.findMany({
      where,
      orderBy,
      skip,
      take: size,
    });
  }

  async getFilterCount(filter: any) {
    const { keyword, status } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { customer_name: { contains: keyword } },
        { product_name: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }
    if (status !== undefined && status !== "") {
      where.status = status;
    }

    return await this.prisma.price_inquiry.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.price_inquiry.findUnique({
      where: { id },
    });
  }

  async createPriceInquiry(createData: CreatePriceInquiryDto) {
    try {
      const result = await this.prisma.price_inquiry.create({
        data: {
          mobile: (createData as any).mobile || (createData as any).phone || "",
          content:
            (createData as any).content ||
            (createData as any).product_name ||
            "",
          product_id: (createData as any).product_id || 0,
          remark: (createData as any).remark || "",
          status: (createData as any).status ?? 0,
          shop_id: (createData as any).shop_id || 0,
          create_time:
            (createData as any).create_time ?? Math.floor(Date.now() / 1000),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建价格查询失败:", error);
      return null;
    }
  }

  async updatePriceInquiry(id: number, updateData: UpdatePriceInquiryDto) {
    try {
      const result = await this.prisma.price_inquiry.update({
        where: { id },
        data: {
          ...((updateData as any).mobile !== undefined && {
            mobile: (updateData as any).mobile,
          }),
          ...((updateData as any).phone !== undefined && {
            mobile: (updateData as any).phone,
          }),
          ...((updateData as any).content !== undefined && {
            content: (updateData as any).content,
          }),
          ...((updateData as any).product_id !== undefined && {
            product_id: (updateData as any).product_id,
          }),
          ...((updateData as any).remark !== undefined && {
            remark: (updateData as any).remark,
          }),
          ...((updateData as any).status !== undefined && {
            status: (updateData as any).status,
          }),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新价格查询失败:", error);
      return null;
    }
  }

  async deletePriceInquiry(id: number) {
    try {
      await this.prisma.price_inquiry.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除价格查询失败:", error);
      return false;
    }
  }

  async batchDeletePriceInquiry(ids: number[]) {
    try {
      await this.prisma.price_inquiry.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除价格查询失败:", error);
      return false;
    }
  }

  async replyPriceInquiry(id: number, replyData: any) {
    try {
      const result = await this.prisma.price_inquiry.update({
        where: { id },
        data: {
          remark:
            (replyData as any).reply_content ?? (replyData as any).remark ?? "",
          status: 1, // 已回复
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("回复价格查询失败:", error);
      return null;
    }
  }

  async getPriceInquiryStatistics() {
    try {
      const total = await this.prisma.price_inquiry.count();
      const pending = await this.prisma.price_inquiry.count({
        where: { status: 0 },
      });
      const replied = await this.prisma.price_inquiry.count({
        where: { status: 1 },
      });
      const todayCount = 0;

      return {
        total,
        pending,
        replied,
        today_count: todayCount,
      };
    } catch (error) {
      this.logger.debug("获取价格查询统计失败:", error);
      return {
        total: 0,
        pending: 0,
        replied: 0,
        today_count: 0,
      };
    }
  }
}
