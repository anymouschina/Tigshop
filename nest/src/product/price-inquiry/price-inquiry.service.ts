// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreatePriceInquiryDto,
  UpdatePriceInquiryDto,
} from "./dto/price-inquiry.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class PriceInquiryService {
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

    const orderBy: any = {};
    if (sort_field) {
      orderBy[sort_field] = sort_order || "desc";
    } else {
      orderBy.id = "desc";
    }

    const skip = (page - 1) * size;

    return await this.prisma.priceInquiry.findMany({
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

    return await this.prisma.priceInquiry.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.priceInquiry.findUnique({
      where: { id },
    });
  }

  async createPriceInquiry(createData: CreatePriceInquiryDto) {
    try {
      const result = await this.prisma.priceInquiry.create({
        data: {
          customer_name: createData.customer_name,
          phone: createData.phone,
          email: createData.email,
          product_name: createData.product_name,
          specification: createData.specification,
          quantity: createData.quantity,
          remark: createData.remark,
          status: 0, // 待处理
          created_at: new Date(),
          updated_at: new Date(),
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
      const result = await this.prisma.priceInquiry.update({
        where: { id },
        data: {
          ...(updateData.customer_name && {
            customer_name: updateData.customer_name,
          }),
          ...(updateData.phone && { phone: updateData.phone }),
          ...(updateData.email !== undefined && { email: updateData.email }),
          ...(updateData.product_name && {
            product_name: updateData.product_name,
          }),
          ...(updateData.specification !== undefined && {
            specification: updateData.specification,
          }),
          ...(updateData.quantity !== undefined && {
            quantity: updateData.quantity,
          }),
          ...(updateData.remark !== undefined && { remark: updateData.remark }),
          ...(updateData.status !== undefined && { status: updateData.status }),
          updated_at: new Date(),
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
      await this.prisma.priceInquiry.delete({
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
      await this.prisma.priceInquiry.deleteMany({
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
      const result = await this.prisma.priceInquiry.update({
        where: { id },
        data: {
          reply_content: replyData.reply_content,
          reply_time: new Date(),
          status: 1, // 已回复
          updated_at: new Date(),
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
      const total = await this.prisma.priceInquiry.count();
      const pending = await this.prisma.priceInquiry.count({
        where: { status: 0 },
      });
      const replied = await this.prisma.priceInquiry.count({
        where: { status: 1 },
      });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.priceInquiry.count({
        where: {
          created_at: {
            gte: today,
          },
        },
      });

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
