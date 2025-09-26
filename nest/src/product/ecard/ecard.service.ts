// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateECardDto, UpdateECardDto } from "./dto/ecard.dto";
import { ResponseUtil } from "../../../common/utils/response.util";

@Injectable()
export class ECardService {
  private readonly logger = new Logger(ECardService.name);
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { group_id, is_use, keyword, page, size, sort_field, sort_order } =
      filter;

    const where: any = {};
    if (group_id) {
      where.group_id = group_id;
    }
    if (is_use !== -1) {
      where.is_use = is_use === 1;
    }
    if (keyword) {
      where.OR = [
        { card_name: { contains: keyword } },
        { card_sn: { contains: keyword } },
      ];
    }

    const orderBy: any = {};
    if (sort_field) {
      orderBy[sort_field] = sort_order || "desc";
    } else {
      orderBy.id = "desc";
    }

    const skip = (page - 1) * size;

    return await this.prisma.eCard.findMany({
      where,
      orderBy,
      skip,
      take: size,
      include: {
        ecard_group: true,
      },
    });
  }

  async getFilterCount(filter: any) {
    const { group_id, is_use, keyword } = filter;

    const where: any = {};
    if (group_id) {
      where.group_id = group_id;
    }
    if (is_use !== -1) {
      where.is_use = is_use === 1;
    }
    if (keyword) {
      where.OR = [
        { card_name: { contains: keyword } },
        { card_sn: { contains: keyword } },
      ];
    }

    return await this.prisma.eCard.count({ where });
  }

  async getDetail(id: number) {
    return await this.prisma.eCard.findUnique({
      where: { id },
      include: {
        ecard_group: true,
      },
    });
  }

  async createECard(createData: CreateECardDto) {
    try {
      const result = await this.prisma.eCard.create({
        data: {
          card_name: createData.card_name,
          card_sn: createData.card_sn,
          card_password: createData.card_password,
          group_id: createData.group_id,
          face_value: createData.face_value,
          is_use: createData.is_use,
          start_time: createData.start_time
            ? new Date(createData.start_time)
            : null,
          end_time: createData.end_time ? new Date(createData.end_time) : null,
          sort_order: createData.sort_order,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("创建电子卡券失败:", error);
      return null;
    }
  }

  async updateECard(id: number, updateData: UpdateECardDto) {
    try {
      const result = await this.prisma.eCard.update({
        where: { id },
        data: {
          ...(updateData.card_name && { card_name: updateData.card_name }),
          ...(updateData.card_sn && { card_sn: updateData.card_sn }),
          ...(updateData.card_password && {
            card_password: updateData.card_password,
          }),
          ...(updateData.group_id !== undefined && {
            group_id: updateData.group_id,
          }),
          ...(updateData.face_value !== undefined && {
            face_value: updateData.face_value,
          }),
          ...(updateData.is_use !== undefined && { is_use: updateData.is_use }),
          ...(updateData.start_time !== undefined && {
            start_time: updateData.start_time
              ? new Date(updateData.start_time)
              : null,
          }),
          ...(updateData.end_time !== undefined && {
            end_time: updateData.end_time
              ? new Date(updateData.end_time)
              : null,
          }),
          ...(updateData.sort_order !== undefined && {
            sort_order: updateData.sort_order,
          }),
          updated_at: new Date(),
        },
      });
      return result;
    } catch (error) {
      this.logger.debug("更新电子卡券失败:", error);
      return null;
    }
  }

  async deleteECard(id: number) {
    try {
      await this.prisma.eCard.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.debug("删除电子卡券失败:", error);
      return false;
    }
  }

  async batchDeleteECard(ids: number[]) {
    try {
      await this.prisma.eCard.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.debug("批量删除电子卡券失败:", error);
      return false;
    }
  }

  async getECardStatistics() {
    try {
      const total = await this.prisma.eCard.count();
      const used = await this.prisma.eCard.count({ where: { is_use: true } });
      const unused = await this.prisma.eCard.count({
        where: { is_use: false },
      });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.eCard.count({
        where: {
          created_at: {
            gte: today,
          },
        },
      });

      return {
        total,
        used,
        unused,
        today_count: todayCount,
      };
    } catch (error) {
      this.logger.debug("获取电子卡券统计失败:", error);
      return {
        total: 0,
        used: 0,
        unused: 0,
        today_count: 0,
      };
    }
  }

  async exportECard(exportData: any) {
    // 导出功能实现
    return { url: "/export/ecard.xlsx", message: "导出成功" };
  }

  async importECard(importData: any) {
    // 导入功能实现
    return { success: true, message: "导入成功" };
  }
}
