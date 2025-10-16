// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserPointsLogDto } from "./dto/user-points-log.dto";

@Injectable()
export class UserPointsLogService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const { page, size, sort_field, sort_order, keyword } = filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    // 避免使用 Prisma 未声明关系的 where 语法；改为仅基于本表字段和数字匹配
    const where: any = {};
    if (keyword) {
      const or: any[] = [{ change_desc: { contains: keyword } }];
      const kwNum = Number(keyword);
      if (!Number.isNaN(kwNum) && kwNum > 0) {
        or.push({ log_id: kwNum });
        or.push({ user_id: kwNum });
        or.push({ points: kwNum });
      }
      where.OR = or;
    }

    const rows = await (this.prisma as any).user_points_log.findMany({
      where,
      skip,
      take: size,
      orderBy,
    });

    // 手动补充用户名信息
    const userIds = Array.from(
      new Set(rows.map((r: any) => r.user_id).filter(Boolean)),
    );
    const users = userIds.length
      ? await (this.prisma as any).user.findMany({
          where: { user_id: { in: userIds } },
          select: { user_id: true, username: true },
        })
      : [];
    const userMap = new Map(users.map((u: any) => [u.user_id, u.username]));

    const records = rows.map((r: any) => ({
      ...r,
      username: userMap.get(r.user_id) || "",
    }));
    return records;
  }

  async getFilterCount(filter: any): Promise<number> {
    const { page, size, sort_field, sort_order, keyword } = filter;

    const where: any = {};
    if (keyword) {
      const or: any[] = [{ change_desc: { contains: keyword } }];
      const kwNum = Number(keyword);
      if (!Number.isNaN(kwNum) && kwNum > 0) {
        or.push({ log_id: kwNum });
        or.push({ user_id: kwNum });
        or.push({ points: kwNum });
      }
      where.OR = or;
    }

    return (this.prisma as any).user_points_log.count({ where });
  }

  async getUserById(userId: number) {
    const user = await (this.prisma as any).user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        points: true,
      },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    return user;
  }

  async deleteUserPointsLog(id: number) {
    return (this.prisma as any).user_points_log.delete({
      where: { log_id: id },
    });
  }

  async batchDeleteUserPointsLog(ids: number[]) {
    return (this.prisma as any).user_points_log.deleteMany({
      where: { log_id: { in: ids } },
    });
  }

  async createUserPointsLog(createData: CreateUserPointsLogDto) {
    const { user_id, points, type, remark } = createData;

    // 开启事务
    const result = await this.prisma.$transaction(async (prisma) => {
      // 更新用户积分
      await (prisma as any).user.update({
        where: { user_id },
        data: {
          points: { increment: points },
        },
      });

      // 创建积分日志
      const pointsLog = await (prisma as any).user_points_log.create({
        data: {
          user_id,
          points,
          change_type: type,
          change_desc: remark,
          change_time: Math.floor(Date.now() / 1000),
        },
      });

      return pointsLog;
    });

    return result;
  }

  async getDetail(id: number) {
    const item = await (this.prisma as any).user_points_log.findUnique({
      where: { log_id: id },
    });

    if (!item) {
      throw new Error("积分日志不存在");
    }

    return item;
  }

  async getPointsSummary(filter: any) {
    const { start_date, end_date, user_id } = filter;

    const where: any = {};
    if (start_date && end_date) {
      where.change_time = {
        gte: Math.floor(new Date(start_date).getTime() / 1000),
        lte: Math.floor(new Date(end_date).getTime() / 1000),
      };
    }
    if (user_id) {
      where.user_id = user_id;
    }

    const summary = await (this.prisma as any).user_points_log.groupBy({
      by: ["change_type"],
      where,
      _sum: {
        points: true,
      },
      _count: {
        points: true,
      },
    });

    return summary;
  }
}
