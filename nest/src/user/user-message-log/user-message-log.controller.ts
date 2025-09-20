import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Delete, Put, Query, Param, Body, UseGuards } from '@nestjs/common';
import { UserMessageLogService } from './user-message-log.service';
import { CreateUserMessageLogDto, BatchDeleteDto } from './dto/user-message-log.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('用户消息日志')
@Controller('admin/user/message-log')
@UseGuards(AdminAuthGuard)
export class UserMessageLogController {
  constructor(private readonly userMessageLogService: UserMessageLogService) {}

  @ApiOperation({ summary: '用户消息日志列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'message_type', description: '消息类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: any) {
    const filter = {
      keyword: query.keyword || '',
      message_type: query.message_type || '',
      status: query.status || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'log_id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.userMessageLogService.getFilterResult(filter);
    const total = await this.userMessageLogService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '用户消息日志详情' })
  @ApiParam({ name: 'id', description: '日志ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.userMessageLogService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '删除用户消息日志' })
  @ApiParam({ name: 'id', description: '日志ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.userMessageLogService.deleteUserMessageLog(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: BatchDeleteDto) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.userMessageLogService.batchDeleteUserMessageLog(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '创建用户消息日志' })
  @Post('create')
  async create(@Body() createData: CreateUserMessageLogDto) {
    const result = await this.userMessageLogService.createUserMessageLog(createData);
    if (!result) {
      return ResponseUtil.error('创建失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '更新用户消息日志' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: any) {
    const result = await this.userMessageLogService.updateUserMessageLog(id, updateData);
    if (!result) {
      return ResponseUtil.error('更新失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '标记为已读' })
  @Put('mark-read/:id')
  async markRead(@Param('id') id: number) {
    const result = await this.userMessageLogService.markAsRead(id);
    if (!result) {
      return ResponseUtil.error('标记失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量标记为已读' })
  @Post('batch-mark-read')
  async batchMarkRead(@Body() batchData: BatchDeleteDto) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    await this.userMessageLogService.batchMarkAsRead(batchData.ids);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '消息统计' })
  @Get('statistics')
  async statistics(@Query() query: any) {
    const { start_date, end_date, user_id } = query;
    const statistics = await this.userMessageLogService.getMessageStatistics({
      start_date,
      end_date,
      user_id,
    });
    return ResponseUtil.success(statistics);
  }
}
