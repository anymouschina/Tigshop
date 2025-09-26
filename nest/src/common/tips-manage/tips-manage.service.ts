// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateTipsManageDto,
  UpdateTipsManageDto,
} from "./dto/tips-manage.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class TipsManageService {
  private readonly logger = new Logger(TipsManageService.name);
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

    return await this.prisma.tips_manage.findMany({
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

    return await this.prisma.tips_manage.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.tips_manage.findUnique({
      where: { id },
    });
  }

  async createTipsManage(createData: CreateTipsManageDto) {
    try {
      const result = await this.prisma.tips_manage.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建提示管理失败:", error);
      return null;
    }
  }

  async updateTipsManage(id: number, updateData: UpdateTipsManageDto) {
    try {
      const result = await this.prisma.tips_manage.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新提示管理失败:", error);
      return null;
    }
  }

  async deleteTipsManage(id: number) {
    try {
      await this.prisma.tips_manage.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除提示管理失败:", error);
      return false;
    }
  }

  async batchDeleteTipsManage(ids: number[]) {
    try {
      await this.prisma.tips_manage.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除提示管理失败:", error);
      return false;
    }
  }

  async getTipsManageStatistics() {
    try {
      const total = await this.prisma.tips_manage.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.tips_manage.count({
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
      this.logger.debug("获取提示管理统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
