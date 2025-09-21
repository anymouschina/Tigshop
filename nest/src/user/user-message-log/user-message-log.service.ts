// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserMessageLogDto } from "./dto/user-message-log.dto";

@Injectable()
export class UserMessageLogService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const {
      page,
      size,
      sort_field,
      sort_order,
      keyword,
      message_type,
      status,
    } = filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    const where: any = {};
    if (keyword) {
      where.OR = [
        { user: { username: { contains: keyword } } },
        { user: { mobile: { contains: keyword } } },
        { user: { email: { contains: keyword } } },
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }
    if (message_type) {
      where.message_type = parseInt(message_type);
    }
    if (status !== "") {
      where.status = parseInt(status);
    }

    const records = await (this.prisma as any).user_message_log.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mobile: true,
            email: true,
          },
        },
      },
      skip,
      take: size,
      orderBy,
    });

    return records;
  }

  async getFilterCount(filter: any): Promise<number> {
    const {
      page,
      size,
      sort_field,
      sort_order,
      keyword,
      message_type,
      status,
    } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { user: { username: { contains: keyword } } },
        { user: { mobile: { contains: keyword } } },
        { user: { email: { contains: keyword } } },
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }
    if (message_type) {
      where.message_type = parseInt(message_type);
    }
    if (status !== "") {
      where.status = parseInt(status);
    }

    return (this.prisma as any).user_message_log.count({ where });
  }

  async getDetail(id: number) {
    const item = await (this.prisma as any).user_message_log.findUnique({
      where: { message_log_id: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error("用户消息日志不存在");
    }

    return item;
  }

  async deleteUserMessageLog(id: number) {
    return (this.prisma as any).user_message_log.delete({
      where: { message_log_id: id },
    });
  }

  async batchDeleteUserMessageLog(ids: number[]) {
    return (this.prisma as any).user_message_log.deleteMany({
      where: { message_log_id: { in: ids } },
    });
  }

  async createUserMessageLog(createData: CreateUserMessageLogDto) {
    return (this.prisma as any).user_message_log.create({
      data: {
        user_id: createData.user_id,
        message_title: createData.title,
        message_content: createData.content,
        message_type: createData.message_type,
        is_recall: 0,
        send_time: Math.floor(Date.now() / 1000),
      },
    });
  }

  async updateUserMessageLog(id: number, updateData: any) {
    return (this.prisma as any).user_message_log.update({
      where: { message_log_id: id },
      data: updateData as any,
    });
  }

  async markAsRead(id: number) {
    // user_message_log is a log for broadcasts; read flags are stored in user_message table.
    return (this.prisma as any).user_message.updateMany({
      where: { message_log_id: id },
      data: { is_read: 1 },
    });
  }

  async batchMarkAsRead(ids: number[]) {
    return (this.prisma as any).user_message.updateMany({
      where: { message_log_id: { in: ids } },
      data: { is_read: 1 },
    });
  }

  async getMessageStatistics(filter: any) {
    const { start_date, end_date, user_id } = filter;

    const where: any = {};
    if (start_date && end_date) {
      where.create_time = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    }
    if (user_id) {
      where.user_id = user_id;
    }

    const [total, unread, byType] = await Promise.all([
      (this.prisma as any).user_message_log.count({ where }),
      (this.prisma as any).user_message.count({
        where: { ...where, is_read: 0 },
      }),
      (this.prisma as any).user_message_log.groupBy({
        by: ["message_type"],
        where,
        _count: {
          message_type: true,
        },
      }),
    ]);

    const typeStats = {};
    byType.forEach((stat) => {
      typeStats[stat.message_type] = stat._count.message_type;
    });

    return {
      total,
      unread,
      read: total - unread,
      by_type: typeStats,
    };
  }

  async sendUserMessage(
    userId: number,
    title: string,
    content: string,
    messageType: number,
  ) {
    return this.prisma.userMessageLog.create({
      data: {
        user_id: userId,
        title,
        content,
        message_type: messageType,
        status: 0,
        create_time: new Date(),
      },
    });
  }

  async sendBatchMessage(
    userIds: number[],
    title: string,
    content: string,
    messageType: number,
  ) {
    const messages = userIds.map((userId) => ({
      user_id: userId,
      title,
      content,
      message_type: messageType,
      status: 0,
      create_time: new Date(),
    }));

    return this.prisma.userMessageLog.createMany({
      data: messages,
    });
  }
}
