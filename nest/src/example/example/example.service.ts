// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateExampleDto, UpdateExampleDto } from "./dto/example.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ExampleService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { keyword, page, size, sort_field, sort_order } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [{ example_name: { contains: keyword } }];
    }

    const orderBy: any = {};
    if (sort_field) {
      orderBy[sort_field] = sort_order || "desc";
    } else {
      orderBy.id = "desc";
    }

    const skip = (page - 1) * size;

    return await this.prisma.example.findMany({
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
      where.OR = [{ example_name: { contains: keyword } }];
    }

    return await this.prisma.example.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.example.findUnique({
      where: { id },
    });
  }

  async createExample(createData: CreateExampleDto) {
    try {
      const result = await this.prisma.example.create({
        data: {
          example_name: createData.example_name,
          sort_order: createData.sort_order,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建示例失败:", error);
      return null;
    }
  }

  async updateExample(id: number, updateData: UpdateExampleDto) {
    try {
      const result = await this.prisma.example.update({
        where: { id },
        data: {
          ...(updateData.example_name && {
            example_name: updateData.example_name,
          }),
          ...(updateData.sort_order !== undefined && {
            sort_order: updateData.sort_order,
          }),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新示例失败:", error);
      return null;
    }
  }

  async deleteExample(id: number) {
    try {
      await this.prisma.example.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除示例失败:", error);
      return false;
    }
  }

  async batchDeleteExample(ids: number[]) {
    try {
      await this.prisma.example.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除示例失败:", error);
      return false;
    }
  }

  async getExampleStatistics() {
    try {
      const total = await this.prisma.example.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.example.count({
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
      this.logger.debug("获取示例统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
