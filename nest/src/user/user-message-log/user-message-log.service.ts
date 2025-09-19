import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateUserMessageLogDto } from './dto/user-message-log.dto';

@Injectable()
export class UserMessageLogService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const { page, size, sort_field, sort_order, keyword, message_type, status } = filter;

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
    if (status !== '') {
      where.status = parseInt(status);
    }

    const records = await this.prisma.userMessageLog.findMany({
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
    const { page, size, sort_field, sort_order, keyword, message_type, status } = filter;

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
    if (status !== '') {
      where.status = parseInt(status);
    }

    return this.prisma.userMessageLog.count({ where });
  }

  async getDetail(id: number) {
    const item = await this.prisma.userMessageLog.findUnique({
      where: { log_id: id },
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
      throw new Error('用户消息日志不存在');
    }

    return item;
  }

  async deleteUserMessageLog(id: number) {
    return this.prisma.userMessageLog.delete({
      where: { log_id: id },
    });
  }

  async batchDeleteUserMessageLog(ids: number[]) {
    return this.prisma.userMessageLog.deleteMany({
      where: { log_id: { in: ids } },
    });
  }

  async createUserMessageLog(createData: CreateUserMessageLogDto) {
    return this.prisma.userMessageLog.create({
      data: {
        user_id: createData.user_id,
        title: createData.title,
        content: createData.content,
        message_type: createData.message_type,
        status: createData.status || 0,
        create_time: new Date(),
      },
    });
  }

  async updateUserMessageLog(id: number, updateData: any) {
    return this.prisma.userMessageLog.update({
      where: { log_id: id },
      data: {
        ...updateData,
        update_time: new Date(),
      },
    });
  }

  async markAsRead(id: number) {
    return this.prisma.userMessageLog.update({
      where: { log_id: id },
      data: {
        status: 1,
        read_time: new Date(),
      },
    });
  }

  async batchMarkAsRead(ids: number[]) {
    return this.prisma.userMessageLog.updateMany({
      where: { log_id: { in: ids } },
      data: {
        status: 1,
        read_time: new Date(),
      },
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
      this.prisma.userMessageLog.count({ where }),
      this.prisma.userMessageLog.count({ where: { ...where, status: 0 } }),
      this.prisma.userMessageLog.groupBy({
        by: ['message_type'],
        where,
        _count: {
          message_type: true,
        },
      }),
    ]);

    const typeStats = {};
    byType.forEach(stat => {
      typeStats[stat.message_type] = stat._count.message_type;
    });

    return {
      total,
      unread,
      read: total - unread,
      by_type: typeStats,
    };
  }

  async sendUserMessage(userId: number, title: string, content: string, messageType: number) {
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

  async sendBatchMessage(userIds: number[], title: string, content: string, messageType: number) {
    const messages = userIds.map(userId => ({
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