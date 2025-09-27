import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUserMessageListDto } from './dto/user-message.dto';

@Injectable()
export class UserMessageService {
  private readonly logger = new Logger(UserMessageService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户消息列表
   */
  async getUserMessageList(userId: number, query: GetUserMessageListDto) {
    try {
      const { page = 1, size = 15, unread = 0 } = query;
      const skip = (page - 1) * size;

      const where: any = {
        user_id: userId,
      };

      // 如果只显示未读消息
      if (unread === 1) {
        where.is_read = 0;
      }

      const [messages, total] = await Promise.all([
        this.prisma.user_message.findMany({
          where,
          orderBy: [{ add_time: 'desc' }, { message_id: 'desc' }],
          skip,
          take: size,
        }),
        this.prisma.user_message.count({ where }),
      ]);

      // 格式化返回数据
      const formattedMessages = messages.map((message) => ({
        message_id: message.message_id,
        title: message.title,
        content: message.content,
        link: message.link,
        is_read: message.is_read === 1,
        add_time: message.add_time,
        add_time_format: this.formatTimestamp(message.add_time),
      }));

      return {
        records: formattedMessages,
        total,
        current: page,
        size,
      };
    } catch (error) {
      this.logger.error(`获取用户消息列表失败，用户ID: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 标记消息为已读
   */
  async markMessageAsRead(messageId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.prisma.user_message.updateMany({
        where: {
          message_id: messageId,
          user_id: userId,
          is_read: 0, // 只更新未读消息
        },
        data: {
          is_read: 1,
        },
      });

      return result.count > 0;
    } catch (error) {
      this.logger.error(`标记消息已读失败，消息ID: ${messageId}, 用户ID: ${userId}`, error);
      return false;
    }
  }

  /**
   * 标记所有消息为已读
   */
  async markAllMessagesAsRead(userId: number): Promise<boolean> {
    try {
      const result = await this.prisma.user_message.updateMany({
        where: {
          user_id: userId,
          is_read: 0, // 只更新未读消息
        },
        data: {
          is_read: 1,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`标记所有消息已读失败，用户ID: ${userId}`, error);
      return false;
    }
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.prisma.user_message.deleteMany({
        where: {
          message_id: messageId,
          user_id: userId,
        },
      });

      return result.count > 0;
    } catch (error) {
      this.logger.error(`删除消息失败，消息ID: ${messageId}, 用户ID: ${userId}`, error);
      return false;
    }
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      return await this.prisma.user_message.count({
        where: {
          user_id: userId,
          is_read: 0,
        },
      });
    } catch (error) {
      this.logger.error(`获取未读消息数量失败，用户ID: ${userId}`, error);
      return 0;
    }
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(timestamp: number): string {
    if (!timestamp) return '';

    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  }
}