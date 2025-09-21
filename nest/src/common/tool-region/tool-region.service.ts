// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateToolRegionDto,
  UpdateToolRegionDto,
} from "./dto/tool-region.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ToolRegionService {
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

    return await this.prisma.tool_region.findMany({
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

    return await this.prisma.tool_region.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.tool_region.findUnique({
      where: { id },
    });
  }

  async createToolRegion(createData: CreateToolRegionDto) {
    try {
      const result = await this.prisma.tool_region.create({
        data: {
          ...createData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("创建地区工具失败:", error);
      return null;
    }
  }

  async updateToolRegion(id: number, updateData: UpdateToolRegionDto) {
    try {
      const result = await this.prisma.tool_region.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.error("更新地区工具失败:", error);
      return null;
    }
  }

  async deleteToolRegion(id: number) {
    try {
      await this.prisma.tool_region.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("删除地区工具失败:", error);
      return false;
    }
  }

  async batchDeleteToolRegion(ids: number[]) {
    try {
      await this.prisma.tool_region.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error("批量删除地区工具失败:", error);
      return false;
    }
  }

  async getToolRegionStatistics() {
    try {
      const total = await this.prisma.tool_region.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.tool_region.count({
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
      console.error("获取地区工具统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
