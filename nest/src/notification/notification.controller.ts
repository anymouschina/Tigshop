import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  MarkAsReadDto,
  NotificationTemplateDto,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('通知管理')
@ApiBearerAuth()
@Controller('notification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: '创建通知' })
  @ApiResponse({ status: 201, description: '通知创建成功' })
  async createNotification(
    @Body() createDto: CreateNotificationDto,
    @Request() req: any,
  ) {
    const senderId = req.user?.userId;
    return this.notificationService.createNotification(createDto, senderId);
  }

  @Get('list')
  @ApiOperation({ summary: '获取通知列表' })
  @ApiResponse({ status: 200, description: '获取通知列表成功' })
  async getNotifications(@Query() query: NotificationQueryDto) {
    const [records, total] = await Promise.all([
      this.notificationService.getFilterResult(query),
      this.notificationService.getFilterCount(query),
    ]);

    return {
      records,
      total,
      page: query.page || 1,
      size: query.size || 15,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取通知详情' })
  @ApiResponse({ status: 200, description: '获取通知详情成功' })
  async getNotificationById(@Param('id') id: number) {
    return this.notificationService.getNotificationById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新通知' })
  @ApiResponse({ status: 200, description: '通知更新成功' })
  async updateNotification(
    @Param('id') id: number,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    return this.notificationService.updateNotification(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({ status: 200, description: '通知删除成功' })
  async deleteNotification(@Param('id') id: number) {
    await this.notificationService.deleteNotification(id);
    return { message: '通知删除成功' };
  }

  @Post('mark-read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAsRead(@Body() markAsReadDto: MarkAsReadDto, @Request() req: any) {
    const userId = req.user?.userId;
    await this.notificationService.markAsRead(markAsReadDto, userId);
    return { message: '标记已读成功' };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.userId;
    await this.notificationService.markAllAsRead(userId);
    return { message: '全部标记已读成功' };
  }

  // 用户通知
  @Get('user/list')
  @ApiOperation({ summary: '获取用户通知列表' })
  @ApiResponse({ status: 200, description: '获取用户通知列表成功' })
  async getUserNotifications(@Query() query: NotificationQueryDto, @Request() req: any) {
    const userId = req.user?.userId;
    return this.notificationService.getUserNotifications(userId, query);
  }

  @Get('user/unread-count')
  @ApiOperation({ summary: '获取用户未读通知数量' })
  @ApiResponse({ status: 200, description: '获取未读数量成功' })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.userId;
    const count = await this.notificationService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  // 通知模板
  @Post('template')
  @ApiOperation({ summary: '创建通知模板' })
  @ApiResponse({ status: 201, description: '模板创建成功' })
  @Roles('admin')
  async createTemplate(@Body() templateDto: NotificationTemplateDto) {
    return this.notificationService.createTemplate(templateDto);
  }

  @Get('template/list')
  @ApiOperation({ summary: '获取通知模板列表' })
  @ApiResponse({ status: 200, description: '获取模板列表成功' })
  async getTemplates() {
    return this.notificationService.getTemplates();
  }

  @Get('template/:code')
  @ApiOperation({ summary: '根据代码获取通知模板' })
  @ApiResponse({ status: 200, description: '获取模板成功' })
  async getTemplateByCode(@Param('code') code: string) {
    return this.notificationService.getTemplateByCode(code);
  }

  @Post('template/:code/send')
  @ApiOperation({ summary: '使用模板发送通知' })
  @ApiResponse({ status: 200, description: '通知发送成功' })
  async sendTemplateNotification(
    @Param('code') code: string,
    @Body() data: {
      templateData: any;
      userId?: number;
      userIds?: number[];
    },
  ) {
    return this.notificationService.sendTemplateNotification(
      code,
      data.templateData,
      data.userId,
      data.userIds,
    );
  }

  // 统计信息
  @Get('stats')
  @ApiOperation({ summary: '获取通知统计信息' })
  @ApiResponse({ status: 200, description: '获取统计信息成功' })
  async getNotificationStats() {
    return this.notificationService.getNotificationStats();
  }

  @Post(':id/send')
  @ApiOperation({ summary: '手动发送通知' })
  @ApiResponse({ status: 200, description: '通知发送成功' })
  async sendNotification(@Param('id') id: number) {
    await this.notificationService.sendNotification(id);
    return { message: '通知发送成功' };
  }
}