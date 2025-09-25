// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreatePrintConfigDto,
  UpdatePrintConfigDto,
} from "./dto/print-config.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class PrintConfigService {
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

    return await this.prisma.print_config.findMany({
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

    return await this.prisma.print_config.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.print_config.findUnique({
      where: { id },
    });
  }

  async createPrintConfig(createData: CreatePrintConfigDto) {
    try {
      const result = await this.prisma.print_config.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建打印配置失败:", error);
      return null;
    }
  }

  async updatePrintConfig(id: number, updateData: UpdatePrintConfigDto) {
    try {
      const result = await this.prisma.print_config.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新打印配置失败:", error);
      return null;
    }
  }

  async deletePrintConfig(id: number) {
    try {
      await this.prisma.print_config.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除打印配置失败:", error);
      return false;
    }
  }

  async batchDeletePrintConfig(ids: number[]) {
    try {
      await this.prisma.print_config.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除打印配置失败:", error);
      return false;
    }
  }

  async getPrintConfigStatistics() {
    try {
      const total = await this.prisma.print_config.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.print_config.count({
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
      this.logger.debug("获取打印配置统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
