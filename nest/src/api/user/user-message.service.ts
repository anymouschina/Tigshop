// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageQueryDto, MessageBatchDto } from './dto/user-message.dto';

@Injectable()
export class UserMessageService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessageList(userId: number, queryDto: MessageQueryDto) {
    const { page = 1, size = 10, status = 'all', message_type, start_date, end_date } = queryDto;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };

    if (status === 'unread') {
      where.is_read = 0;
    } else if (status === 'read') {
      where.is_read = 1;
    }

    if (message_type) {
      where.message_type = message_type;
    }

    if (start_date) {
      where.add_time = { gte: new Date(start_date).getTime() / 1000 };
    }

    if (end_date) {
      where.add_time = { ...where.add_time, lte: new Date(end_date).getTime() / 1000 };
    }

    const [messages, total, unreadCount] = await Promise.all([
      this.prisma.user_message.findMany({
        where,
        skip,
        take: size,
        orderBy: { add_time: 'desc' },
        select: {
          message_id: true,
          title: true,
          content: true,
          message_type: true,
          is_read: true,
          add_time: true,
          related_data: true,
        },
      }),
      this.prisma.user_message.count({ where }),
      this.prisma.user_message.count({
        where: { user_id: userId, is_read: 0 },
      }),
    ]);

    return {
      list: messages,
      total,
      unread_count: unreadCount,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getMessageDetail(userId: number, messageId: number) {
    const message = await this.prisma.user_message.findFirst({
      where: {
        message_id: messageId,
        user_id: userId,
      },
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    // 如果消息未读，标记为已读
    if (message.is_read === 0) {
      await this.prisma.user_message.update({
        where: { message_id: messageId },
        data: { is_read: 1 },
      });
    }

    return message;
  }

  async markAsRead(userId: number, messageId: number) {
    const message = await this.prisma.user_message.findFirst({
      where: {
        message_id: messageId,
        user_id: userId,
      },
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    if (message.is_read === 1) {
      throw new BadRequestException('消息已读');
    }

    await this.prisma.user_message.update({
      where: { message_id: messageId },
      data: { is_read: 1 },
    });

    return { success: true };
  }

  async markAllAsRead(userId: number) {
    await this.prisma.user_message.updateMany({
      where: {
        user_id: userId,
        is_read: 0,
      },
      data: { is_read: 1 },
    });

    return { success: true };
  }

  async deleteMessage(userId: number, messageId: number) {
    const message = await this.prisma.user_message.findFirst({
      where: {
        message_id: messageId,
        user_id: userId,
      },
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    await this.prisma.user_message.delete({
      where: { message_id: messageId },
    });

    return { success: true };
  }

  async batchDeleteMessages(userId: number, batchDto: MessageBatchDto) {
    const { message_ids } = batchDto;

    const result = await this.prisma.user_message.deleteMany({
      where: {
        message_id: { in: message_ids },
        user_id: userId,
      },
    });

    return {
      success: true,
      deleted_count: result.count,
    };
  }

  async batchMarkAsRead(userId: number, batchDto: MessageBatchDto) {
    const { message_ids } = batchDto;

    const result = await this.prisma.user_message.updateMany({
      where: {
        message_id: { in: message_ids },
        user_id: userId,
        is_read: 0,
      },
      data: { is_read: 1 },
    });

    return {
      success: true,
      updated_count: result.count,
    };
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.user_message.count({
      where: {
        user_id: userId,
        is_read: 0,
      },
    });

    return {
      unread_count: count,
    };
  }

  async getMessageStatistics(userId: number) {
    const [totalCount, unreadCount, readCount] = await Promise.all([
      this.prisma.user_message.count({
        where: { user_id: userId },
      }),
      this.prisma.user_message.count({
        where: { user_id: userId, is_read: 0 },
      }),
      this.prisma.user_message.count({
        where: { user_id: userId, is_read: 1 },
      }),
    ]);

    // 按类型统计
    const typeStats = await this.prisma.user_message.groupBy({
      by: ['message_type'],
      where: { user_id: userId },
      _count: true,
    });

    const typeDistribution = typeStats.reduce((acc, stat) => {
      acc[stat.message_type] = stat._count;
      return acc;
    }, {});

    return {
      total_count: totalCount,
      unread_count: unreadCount,
      read_count: readCount,
      type_distribution: typeDistribution,
    };
  }

  async createSystemMessage(userId: number, title: string, content: string, messageType: string = 'system', relatedData?: any) {
    const message = await this.prisma.user_message.create({
      data: {
        user_id: userId,
        title,
        content,
        message_type: messageType,
        related_data: relatedData,
        add_time: Math.floor(Date.now() / 1000),
        is_read: 0,
      },
    });

    return { message_id: message.message_id };
  }

  async sendOrderMessage(userId: number, orderId: number, orderStatus: string) {
    const statusMessages = {
      'paid': '订单已支付',
      'shipped': '订单已发货',
      'completed': '订单已完成',
      'cancelled': '订单已取消',
    };

    const title = statusMessages[orderStatus] || '订单状态更新';
    const content = `您的订单 #${orderId} 状态已更新为：${title}`;

    return await this.createSystemMessage(
      userId,
      title,
      content,
      'order',
      { order_id: orderId, order_status: orderStatus }
    );
  }

  async sendPromotionMessage(userId: number, promotionTitle: string, promotionContent: string, promotionId: number) {
    const title = '促销活动通知';
    const content = `${promotionTitle}\n${promotionContent}`;

    return await this.createSystemMessage(
      userId,
      title,
      content,
      'promotion',
      { promotion_id: promotionId }
    );
  }

  async sendServiceMessage(userId: number, title: string, content: string, serviceType: string) {
    return await this.createSystemMessage(
      userId,
      title,
      content,
      'service',
      { service_type: serviceType }
    );
  }
}
