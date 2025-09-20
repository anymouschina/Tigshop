import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UserFeedbackService } from './user-feedback.service';
import {
  UserFeedbackQueryDto,
  CreateUserFeedbackDto,
  UpdateUserFeedbackDto,
  ReplyUserFeedbackDto,
  BatchUserFeedbackOperationDto
} from './dto/user-feedback.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('用户反馈管理')
@Controller('admin/user-feedback')
@UseGuards(RolesGuard)
@Roles('admin')
export class UserFeedbackController {
  constructor(private readonly userFeedbackService: UserFeedbackService) {}

  @Get()
  @ApiOperation({ summary: '获取用户反馈列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'feedback_type', required: false, description: '反馈类型' })
  @ApiQuery({ name: 'status', required: false, description: '处理状态' })
  @ApiQuery({ name: 'user_id', required: false, description: '用户ID' })
  @ApiQuery({ name: 'start_time', required: false, description: '开始时间' })
  @ApiQuery({ name: 'end_time', required: false, description: '结束时间' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserFeedbackList(@Query() query: UserFeedbackQueryDto) {
    const [records, total] = await Promise.all([
      this.userFeedbackService.getUserFeedbackList(query),
      this.userFeedbackService.getUserFeedbackCount(query)
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户反馈详情' })
  @ApiParam({ name: 'id', description: '反馈ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserFeedbackDetail(@Param('id') id: number) {
    const feedback = await this.userFeedbackService.getUserFeedbackDetail(id);
    return {
      code: 200,
      message: '获取成功',
      data: feedback,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建用户反馈' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createUserFeedback(@Body() createDto: CreateUserFeedbackDto) {
    const result = await this.userFeedbackService.createUserFeedback(createDto);
    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户反馈' })
  @ApiParam({ name: 'id', description: '反馈ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserFeedback(
    @Param('id') id: number,
    @Body() updateDto: UpdateUserFeedbackDto,
  ) {
    const result = await this.userFeedbackService.updateUserFeedback(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put(':id/reply')
  @ApiOperation({ summary: '回复用户反馈' })
  @ApiParam({ name: 'id', description: '反馈ID' })
  @ApiResponse({ status: 200, description: '回复成功' })
  async replyUserFeedback(
    @Param('id') id: number,
    @Body() replyDto: ReplyUserFeedbackDto,
  ) {
    const result = await this.userFeedbackService.replyUserFeedback(id, replyDto);
    return {
      code: 200,
      message: '回复成功',
      data: result,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新反馈状态' })
  @ApiParam({ name: 'id', description: '反馈ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateFeedbackStatus(
    @Param('id') id: number,
    @Body() statusData: { status: number; remark?: string },
  ) {
    const result = await this.userFeedbackService.updateFeedbackStatus(id, statusData);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户反馈' })
  @ApiParam({ name: 'id', description: '反馈ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteUserFeedback(@Param('id') id: number) {
    await this.userFeedbackService.deleteUserFeedback(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  @Post('batch')
  @ApiOperation({ summary: '批量操作用户反馈' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async batchOperation(@Body() batchDto: BatchUserFeedbackOperationDto) {
    const result = await this.userFeedbackService.batchOperation(batchDto);
    return {
      code: 200,
      message: '操作成功',
      data: result,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取反馈统计' })
  @ApiQuery({ name: 'period', required: false, description: '统计周期：day, week, month' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFeedbackStatistics(@Query('period') period: 'day' | 'week' | 'month' = 'week') {
    const statistics = await this.userFeedbackService.getFeedbackStatistics(period);
    return {
      code: 200,
      message: '获取成功',
      data: statistics,
    };
  }

  @Get('types')
  @ApiOperation({ summary: '获取反馈类型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFeedbackTypes() {
    const types = await this.userFeedbackService.getFeedbackTypes();
    return {
      code: 200,
      message: '获取成功',
      data: types,
    };
  }

  @Get('pending-count')
  @ApiOperation({ summary: '获取待处理反馈数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingCount() {
    const count = await this.userFeedbackService.getPendingCount();
    return {
      code: 200,
      message: '获取成功',
      data: { count },
    };
  }

  @Get('export')
  @ApiOperation({ summary: '导出反馈数据' })
  @ApiQuery({ name: 'format', required: false, description: '导出格式：excel, csv', enum: ['excel', 'csv'] })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportFeedback(@Query() query: {
    format?: 'excel' | 'csv';
    start_time?: string;
    end_time?: string;
    feedback_type?: string;
    status?: string;
  }) {
    const result = await this.userFeedbackService.exportFeedback(query);
    return {
      code: 200,
      message: '导出成功',
      data: result,
    };
  }

  @Post('auto-reply')
  @ApiOperation({ summary: '设置自动回复' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setAutoReply(@Body() autoReply: {
    feedback_type: string;
    reply_content: string;
    is_enabled: boolean;
  }) {
    const result = await this.userFeedbackService.setAutoReply(autoReply);
    return {
      code: 200,
      message: '设置成功',
      data: result,
    };
  }

  @Get('auto-reply')
  @ApiOperation({ summary: '获取自动回复设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAutoReply() {
    const autoReply = await this.userFeedbackService.getAutoReply();
    return {
      code: 200,
      message: '获取成功',
      data: autoReply,
    };
  }
}