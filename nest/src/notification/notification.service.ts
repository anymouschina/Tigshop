import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto, BatchSendNotificationDto, NotificationType, NotificationTemplate } from './dto/send-notification.dto';
import { DatabaseService } from 'src/database/database.service';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransporter: nodemailer.Transporter;

  constructor(private readonly databaseService: DatabaseService) {
    this.initializeEmailTransporter();
    this.initializeHandlebars();
  }

  /**
   * 初始化邮件发送器
   */
  private initializeEmailTransporter() {
    // 这里应该从环境变量中读取配置
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * 初始化Handlebars模板引擎
   */
  private initializeHandlebars() {
    // 注册一些常用的Helper
    handlebars.registerHelper('formatDate', function(date: Date, format: string) {
      return new Date(date).toLocaleDateString();
    });

    handlebars.registerHelper('formatCurrency', function(amount: number) {
      return `¥${amount.toFixed(2)}`;
    });

    handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });
  }

  /**
   * 发送单个通知
   * @param notificationDto 通知数据
   * @returns 发送结果
   */
  async send(notificationDto: SendNotificationDto) {
    try {
      // 获取用户信息
      const user = await this.databaseService.user.findUnique({
        where: { userId: notificationDto.userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 渲染模板
      const renderedContent = await this.renderTemplate(
        notificationDto.template,
        notificationDto.content,
        {
          user,
          ...notificationDto.templateData,
          ...notificationDto.relatedData,
        }
      );

      // 创建通知记录
      const notification = await this.databaseService.notification.create({
        data: {
          userId: notificationDto.userId,
          type: notificationDto.type,
          template: notificationDto.template,
          title: notificationDto.title,
          content: renderedContent,
          status: 'pending',
          priority: notificationDto.priority,
          relatedData: notificationDto.relatedData || {},
          scheduledAt: notificationDto.scheduledAt ? new Date(notificationDto.scheduledAt) : null,
        },
      });

      // 如果是立即发送
      if (notificationDto.sendImmediately) {
        await this.processNotification(notification);
      }

      return {
        notificationId: notification.notificationId,
        status: notification.status,
        message: '通知创建成功',
      };
    } catch (error) {
      this.logger.error('发送通知失败:', error);
      throw error;
    }
  }

  /**
   * 批量发送通知
   * @param batchDto 批量通知数据
   * @returns 发送结果
   */
  async sendBatch(batchDto: BatchSendNotificationDto) {
    const results = [];
    const totalUsers = batchDto.userIds.length;

    for (const userId of batchDto.userIds) {
      try {
        const notificationDto: SendNotificationDto = {
          userId,
          type: batchDto.type,
          template: batchDto.template,
          title: batchDto.title,
          content: batchDto.content,
          sendImmediately: true,
          priority: batchDto.priority,
        };

        // 如果需要个性化数据，为每个用户获取个性化信息
        if (batchDto.usePersonalizedData) {
          const user = await this.databaseService.user.findUnique({
            where: { userId },
          });
          notificationDto.templateData = { user };
        }

        const result = await this.send(notificationDto);
        results.push({ userId, success: true, result });
      } catch (error) {
        this.logger.error(`发送通知给用户 ${userId} 失败:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }

    return {
      total: totalUsers,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * 处理通知发送
   * @param notification 通知记录
   */
  private async processNotification(notification: any) {
    try {
      // 更新状态为处理中
      await this.databaseService.notification.update({
        where: { notificationId: notification.notificationId },
        data: { status: 'processing' },
      });

      let result;

      switch (notification.type) {
        case NotificationType.EMAIL:
          result = await this.sendEmail(notification);
          break;
        case NotificationType.SMS:
          result = await this.sendSms(notification);
          break;
        case NotificationType.SYSTEM:
          result = await this.sendSystemNotification(notification);
          break;
        case NotificationType.WECHAT:
          result = await this.sendWechatNotification(notification);
          break;
        case NotificationType.PUSH:
          result = await this.sendPushNotification(notification);
          break;
        default:
          throw new Error(`不支持的通知类型: ${notification.type}`);
      }

      // 更新发送结果
      await this.databaseService.notification.update({
        where: { notificationId: notification.notificationId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          result: result,
        },
      });

      return result;
    } catch (error) {
      // 更新失败状态
      await this.databaseService.notification.update({
        where: { notificationId: notification.notificationId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * 发送邮件
   * @param notification 通知记录
   */
  private async sendEmail(notification: any) {
    const user = await this.databaseService.user.findUnique({
      where: { userId: notification.userId },
    });

    if (!user || !user.email) {
      throw new Error('用户邮箱不存在');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: user.email,
      subject: notification.title,
      html: notification.content,
    };

    const result = await this.emailTransporter.sendMail(mailOptions);
    return { messageId: result.messageId };
  }

  /**
   * 发送短信
   * @param notification 通知记录
   */
  private async sendSms(notification: any) {
    const user = await this.databaseService.user.findUnique({
      where: { userId: notification.userId },
    });

    if (!user || !user.mobile) {
      throw new Error('用户手机号不存在');
    }

    // 这里集成短信发送服务
    // 例如：阿里云短信、腾讯云短信等
    return {
      messageId: `sms_${Date.now()}_${notification.notificationId}`,
      provider: 'mock_sms_provider',
    };
  }

  /**
   * 发送系统通知
   * @param notification 通知记录
   */
  private async sendSystemNotification(notification: any) {
    // 系统通知通常存储在数据库中，用户登录时查看
    return {
      messageId: `system_${Date.now()}_${notification.notificationId}`,
      type: 'system',
    };
  }

  /**
   * 发送微信通知
   * @param notification 通知记录
   */
  private async sendWechatNotification(notification: any) {
    const user = await this.databaseService.user.findUnique({
      where: { userId: notification.userId },
    });

    if (!user || !user.openId) {
      throw new Error('用户微信OpenID不存在');
    }

    // 这里集成微信模板消息API
    return {
      messageId: `wechat_${Date.now()}_${notification.notificationId}`,
      provider: 'wechat',
    };
  }

  /**
   * 发送推送通知
   * @param notification 通知记录
   */
  private async sendPushNotification(notification: any) {
    // 这里集成推送服务
    // 例如：Firebase Cloud Messaging、极光推送等
    return {
      messageId: `push_${Date.now()}_${notification.notificationId}`,
      provider: 'mock_push_provider',
    };
  }

  /**
   * 渲染模板
   * @param template 模板名称
   * @param content 内容
   * @param data 模板数据
   * @returns 渲染后的内容
   */
  private async renderTemplate(template: NotificationTemplate, content: string, data: any): Promise<string> {
    try {
      // 如果是自定义模板，直接使用内容
      if (template === NotificationTemplate.CUSTOM) {
        const templateFn = handlebars.compile(content);
        return templateFn(data);
      }

      // 否则使用预定义模板
      const templatePath = path.join(__dirname, 'templates', `${template}.hbs`);

      // 检查模板文件是否存在
      try {
        await fs.promises.access(templatePath);
        const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
        const templateFn = handlebars.compile(templateContent);
        return templateFn(data);
      } catch {
        // 如果模板文件不存在，使用默认内容
        const templateFn = handlebars.compile(content);
        return templateFn(data);
      }
    } catch (error) {
      this.logger.error('渲染模板失败:', error);
      return content;
    }
  }

  /**
   * 获取用户通知列表
   * @param userId 用户ID
   * @param page 页码
   * @param size 每页数量
   * @param type 通知类型
   * @returns 通知列表
   */
  async getUserNotifications(
    userId: number,
    page: number = 1,
    size: number = 20,
    type?: NotificationType,
  ) {
    const skip = (page - 1) * size;

    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      this.databaseService.notification.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 标记通知为已读
   * @param notificationId 通知ID
   * @param userId 用户ID
   * @returns 更新结果
   */
  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.databaseService.notification.findUnique({
      where: { notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('通知不存在或无权限');
    }

    return this.databaseService.notification.update({
      where: { notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * 标记所有通知为已读
   * @param userId 用户ID
   * @returns 更新结果
   */
  async markAllAsRead(userId: number) {
    return this.databaseService.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * 删除通知
   * @param notificationId 通知ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async deleteNotification(notificationId: number, userId: number) {
    const notification = await this.databaseService.notification.findUnique({
      where: { notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('通知不存在或无权限');
    }

    return this.databaseService.notification.delete({
      where: { notificationId },
    });
  }

  /**
   * 处理定时通知
   */
  async processScheduledNotifications() {
    const scheduledNotifications = await this.databaseService.notification.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          lte: new Date(),
        },
      },
    });

    for (const notification of scheduledNotifications) {
      try {
        await this.processNotification(notification);
      } catch (error) {
        this.logger.error(`处理定时通知失败 (${notification.notificationId}):`, error);
      }
    }
  }
}