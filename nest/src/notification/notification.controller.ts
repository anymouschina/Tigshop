import { Controller, Get, Post, Body, Param, Query, Delete, Put, UseGuards, Request, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto, BatchSendNotificationDto, NotificationType, NotificationTemplate } from './dto/send-notification.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('通知管理')
@Controller('api/notification')
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '发送单个通知' })
  @ApiResponse({ status: 200, description: '通知发送成功' })
  async sendNotification(@Body() notificationDto: SendNotificationDto) {
    return this.notificationService.send(notificationDto);
  }

  @Post('send-batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '批量发送通知' })
  @ApiResponse({ status: 200, description: '批量通知发送成功' })
  async sendBatchNotification(@Body() batchDto: BatchSendNotificationDto) {
    return this.notificationService.sendBatch(batchDto);
  }

  @Get('my-notifications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的通知列表' })
  @ApiResponse({ status: 200, description: '获取通知列表成功' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: '通知类型' })
  async getMyNotifications(
    @Request() req,
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('type') type?: NotificationType,
  ) {
    const userId = req.user.userId;
    return this.notificationService.getUserNotifications(userId, page, size, type);
  }

  @Put('mark-read/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAsRead(@Request() req, @Param('id') notificationId: number) {
    const userId = req.user.userId;
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Put('mark-all-read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteNotification(@Request() req, @Param('id') notificationId: number) {
    const userId = req.user.userId;
    return this.notificationService.deleteNotification(notificationId, userId);
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取通知模板列表' })
  @ApiResponse({ status: 200, description: '获取模板列表成功' })
  async getTemplates() {
    return {
      templates: Object.values(NotificationTemplate),
      descriptions: {
        [NotificationTemplate.ORDER_CONFIRMED]: '订单确认通知',
        [NotificationTemplate.ORDER_SHIPPED]: '订单发货通知',
        [NotificationTemplate.ORDER_DELIVERED]: '订单送达通知',
        [NotificationTemplate.PAYMENT_SUCCESS]: '支付成功通知',
        [NotificationTemplate.PAYMENT_FAILED]: '支付失败通知',
        [NotificationTemplate.WELCOME]: '欢迎注册通知',
        [NotificationTemplate.PASSWORD_RESET]: '密码重置通知',
        [NotificationTemplate.EMAIL_VERIFICATION]: '邮箱验证通知',
        [NotificationTemplate.CUSTOM]: '自定义模板',
      },
    };
  }

  @Get('types')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取通知类型列表' })
  @ApiResponse({ status: 200, description: '获取类型列表成功' })
  async getTypes() {
    return {
      types: Object.values(NotificationType),
      descriptions: {
        [NotificationType.EMAIL]: '邮件通知',
        [NotificationType.SMS]: '短信通知',
        [NotificationType.SYSTEM]: '系统通知',
        [NotificationType.WECHAT]: '微信通知',
        [NotificationType.PUSH]: '推送通知',
      },
    };
  }

  @Post('process-scheduled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '处理定时通知' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async processScheduledNotifications() {
    await this.notificationService.processScheduledNotifications();
    return { message: '定时通知处理完成' };
  }
}