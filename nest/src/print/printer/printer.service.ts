// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreatePrinterDto, UpdatePrinterDto } from "./dto/printer.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class PrinterService {
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

    return await this.prisma.printer.findMany({
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

    return await this.prisma.printer.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.printer.findUnique({
      where: { id },
    });
  }

  async createPrinter(createData: CreatePrinterDto) {
    try {
      const result = await this.prisma.printer.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建打印机失败:", error);
      return null;
    }
  }

  async updatePrinter(id: number, updateData: UpdatePrinterDto) {
    try {
      const result = await this.prisma.printer.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新打印机失败:", error);
      return null;
    }
  }

  async deletePrinter(id: number) {
    try {
      await this.prisma.printer.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除打印机失败:", error);
      return false;
    }
  }

  async batchDeletePrinter(ids: number[]) {
    try {
      await this.prisma.printer.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除打印机失败:", error);
      return false;
    }
  }

  async getPrinterStatistics() {
    try {
      const total = await this.prisma.printer.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.printer.count({
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
      this.logger.debug("获取打印机统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
