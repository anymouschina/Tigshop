import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  MarkAsReadDto,
  NotificationTemplateDto,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(createDto: CreateNotificationDto, senderId?: number): Promise<any> {
    const notification = await this.prisma.notification.create({
      data: {
        type: createDto.type,
        title: createDto.title,
        content: createDto.content,
        channels: createDto.channels,
        priority: createDto.priority || NotificationPriority.NORMAL,
        user_id: createDto.userId,
        user_ids: createDto.userIds || [],
        related_data: createDto.relatedData || {},
        scheduled_at: createDto.scheduledAt,
        expire_at: createDto.expireAt,
        sender_id: senderId,
        status: NotificationStatus.PENDING,
        is_read: false,
      },
    });

    // 如果没有指定发送时间，立即发送
    if (!createDto.scheduledAt || createDto.scheduledAt <= new Date()) {
      await this.sendNotification(notification.id);
    }

    return this.getNotificationById(notification.id);
  }

  async sendNotification(notificationId: number): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    try {
      // 发送到各个渠道
      for (const channel of notification.channels) {
        await this.sendToChannel(notification, channel);
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.SENT,
          sent_at: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          error_message: error.message,
        },
      });
      throw new BadRequestException(`通知发送失败: ${error.message}`);
    }
  }

  private async sendToChannel(notification: any, channel: NotificationChannel): Promise<void> {
    const recipients = notification.user_id
      ? [notification.user_id]
      : notification.user_ids || [];

    for (const userId of recipients) {
      const notificationLog = await this.prisma.notificationLog.create({
        data: {
          notification_id: notification.id,
          user_id: userId,
          channel,
          status: 'pending',
        },
      });

      try {
        switch (channel) {
          case NotificationChannel.IN_APP:
            await this.sendInAppNotification(notification, userId);
            break;
          case NotificationChannel.EMAIL:
            await this.sendEmailNotification(notification, userId);
            break;
          case NotificationChannel.SMS:
            await this.sendSmsNotification(notification, userId);
            break;
          case NotificationChannel.PUSH:
            await this.sendPushNotification(notification, userId);
            break;
          case NotificationChannel.WECHAT:
            await this.sendWechatNotification(notification, userId);
            break;
        }

        await this.prisma.notificationLog.update({
          where: { id: notificationLog.id },
          data: {
            status: 'sent',
            sent_at: new Date(),
          },
        });
      } catch (error) {
        await this.prisma.notificationLog.update({
          where: { id: notificationLog.id },
          data: {
            status: 'failed',
            error_message: error.message,
          },
        });
      }
    }
  }

  private async sendInAppNotification(notification: any, userId: number): Promise<void> {
    // 应用内通知直接保存到数据库
    await this.prisma.userNotification.create({
      data: {
        notification_id: notification.id,
        user_id: userId,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        related_data: notification.related_data,
        is_read: false,
      },
    });
  }

  private async sendEmailNotification(notification: any, userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user || !user.email) {
      throw new Error('用户邮箱不存在');
    }

    // TODO: 集成邮件服务
    console.log(`发送邮件通知到 ${user.email}: ${notification.title}`);
  }

  private async sendSmsNotification(notification: any, userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user || !user.mobile) {
      throw new Error('用户手机号不存在');
    }

    // TODO: 集成短信服务
    console.log(`发送短信通知到 ${user.mobile}: ${notification.title}`);
  }

  private async sendPushNotification(notification: any, userId: number): Promise<void> {
    // TODO: 集成推送服务
    console.log(`发送推送通知到用户 ${userId}: ${notification.title}`);
  }

  private async sendWechatNotification(notification: any, userId: number): Promise<void> {
    // TODO: 集成微信服务
    console.log(`发送微信通知到用户 ${userId}: ${notification.title}`);
  }

  async getFilterResult(query: NotificationQueryDto): Promise<any[]> {
    const where = this.buildWhereClause(query);
    const orderBy = this.buildOrderBy(query);
    const skip = ((query.page || 1) - 1) * (query.size || 15);
    const take = query.size || 15;

    return this.prisma.notification.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        sender: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async getFilterCount(query: NotificationQueryDto): Promise<number> {
    const where = this.buildWhereClause(query);
    return this.prisma.notification.count({ where });
  }

  private buildWhereClause(query: NotificationQueryDto): any {
    const where: any = {};

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { content: { contains: query.keyword } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.channel) {
      where.channels = {
        has: query.channel,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.userId) {
      where.OR = [
        { user_id: query.userId },
        { user_ids: { has: query.userId } },
      ];
    }

    if (query.isRead !== undefined) {
      where.is_read = query.isRead;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.startTime && query.endTime) {
      where.created_at = {
        gte: new Date(query.startTime),
        lte: new Date(query.endTime),
      };
    }

    return where;
  }

  private buildOrderBy(query: NotificationQueryDto): any {
    const orderBy: any = {};
    const sortField = query.sortField || 'created_at';
    const sortOrder = query.sortOrder || 'desc';

    orderBy[sortField] = sortOrder;
    return orderBy;
  }

  async getNotificationById(id: number): Promise<any> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        logs: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    return notification;
  }

  async updateNotification(id: number, updateDto: UpdateNotificationDto): Promise<any> {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: updateDto,
      include: {
        sender: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return notification;
  }

  async deleteNotification(id: number): Promise<void> {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async markAsRead(markAsReadDto: MarkAsReadDto, userId?: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: {
          in: markAsReadDto.notificationIds,
        },
        OR: [
          { user_id: userId },
          { user_ids: { has: userId } },
        ],
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    // 同时更新用户通知
    await this.prisma.userNotification.updateMany({
      where: {
        notification_id: {
          in: markAsReadDto.notificationIds,
        },
        user_id: userId,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        OR: [
          { user_id: userId },
          { user_ids: { has: userId } },
        ],
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    await this.prisma.userNotification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  async getUserNotifications(userId: number, query: NotificationQueryDto): Promise<any> {
    const where: any = {
      user_id: userId,
    };

    if (query.isRead !== undefined) {
      where.is_read = query.isRead;
    }

    if (query.type) {
      where.type = query.type;
    }

    const orderBy = {
      created_at: 'desc',
    };

    const skip = ((query.page || 1) - 1) * (query.size || 15);
    const take = query.size || 15;

    const [notifications, total] = await Promise.all([
      this.prisma.userNotification.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.userNotification.count({ where }),
    ]);

    return {
      records: notifications,
      total,
      page: query.page || 1,
      size: query.size || 15,
    };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.userNotification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  // 通知模板管理
  async createTemplate(templateDto: NotificationTemplateDto): Promise<any> {
    return this.prisma.notificationTemplate.create({
      data: {
        name: templateDto.name,
        code: templateDto.code,
        type: templateDto.type,
        channels: templateDto.channels,
        title_template: templateDto.titleTemplate,
        content_template: templateDto.contentTemplate,
        description: templateDto.description,
        is_enabled: templateDto.isEnabled ?? true,
      },
    });
  }

  async getTemplates(): Promise<any[]> {
    return this.prisma.notificationTemplate.findMany({
      where: {
        is_enabled: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async getTemplateByCode(code: string): Promise<any> {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: {
        code,
        is_enabled: true,
      },
    });

    if (!template) {
      throw new NotFoundException('通知模板不存在');
    }

    return template;
  }

  async sendTemplateNotification(
    templateCode: string,
    data: any,
    userId?: number,
    userIds?: number[],
  ): Promise<any> {
    const template = await this.getTemplateByCode(templateCode);

    // 替换模板变量
    const title = this.renderTemplate(template.title_template, data);
    const content = this.renderTemplate(template.content_template, data);

    const createDto: CreateNotificationDto = {
      type: template.type as NotificationType,
      title,
      content,
      channels: template.channels as NotificationChannel[],
      userId,
      userIds,
      relatedData: data,
    };

    return this.createNotification(createDto);
  }

  private renderTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  async getNotificationStats(): Promise<any> {
    const totalNotifications = await this.prisma.notification.count();
    const unreadCount = await this.prisma.notification.count({
      where: { is_read: false },
    });

    const typeStats = await this.prisma.notification.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    const channelStats = await this.prisma.notification.groupBy({
      by: ['channels'],
      _count: { id: true },
    });

    return {
      totalNotifications,
      unreadCount,
      typeStats,
      channelStats,
    };
  }
}