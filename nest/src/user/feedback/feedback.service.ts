// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateFeedbackDto, UpdateFeedbackDto } from "./dto/feedback.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
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

    return await this.prisma.feedback.findMany({
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

    return await this.prisma.feedback.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.feedback.findUnique({
      where: { id },
    });
  }

  async createFeedback(createData: CreateFeedbackDto) {
    try {
      const result = await this.prisma.feedback.create({
        data: {
          // Map minimal required fields; other DTO fields are admin-only meta
          content: createData.description || createData.name || "",
          add_time: Math.floor(Date.now() / 1000),
          status: createData.status ? 1 : 0,
          title: createData.name,
        } as any,
      });
      return result;
    } catch (error) {
      this.logger.debug("创建用户反馈失败:", error);
      return null;
    }
  }

  async updateFeedback(id: number, updateData: UpdateFeedbackDto) {
    try {
      const result = await this.prisma.feedback.update({
        where: { id },
        data: {
          content: updateData.description,
          status:
            updateData.status === undefined
              ? undefined
              : updateData.status
                ? 1
                : 0,
          title: updateData.name,
        } as any,
      });
      return result;
    } catch (error) {
      this.logger.debug("更新用户反馈失败:", error);
      return null;
    }
  }

  async deleteFeedback(id: number) {
    try {
      await this.prisma.feedback.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除用户反馈失败:", error);
      return false;
    }
  }

  async batchDeleteFeedback(ids: number[]) {
    try {
      await this.prisma.feedback.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除用户反馈失败:", error);
      return false;
    }
  }

  async getFeedbackStatistics() {
    try {
      const total = await this.prisma.feedback.count();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySec = Math.floor(today.getTime() / 1000);
      const todayCount = await this.prisma.feedback.count({
        where: {
          add_time: { gte: todaySec } as any,
        },
      });

      return {
        total,
        today_count: todayCount,
      };
    } catch (error) {
      this.logger.debug("获取用户反馈统计失败:", error);
      return {
        total: 0,
        today_count: 0,
      };
    }
  }
}
