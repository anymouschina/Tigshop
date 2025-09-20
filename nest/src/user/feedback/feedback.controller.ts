import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto, QueryFeedbackDto } from './dto/feedback.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('用户反馈管理')
@Controller('admin/user/feedback')
@UseGuards(AdminAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiOperation({ summary: '用户反馈列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryFeedbackDto) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.feedbackService.getFilterList(filter);
    const total = await this.feedbackService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '用户反馈详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.feedbackService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建用户反馈' })
  @Post('create')
  async create(@Body() createData: CreateFeedbackDto) {
    const result = await this.feedbackService.createFeedback(createData);
    if (result) {
      return ResponseUtil.success('用户反馈创建成功');
    } else {
      return ResponseUtil.error('用户反馈创建失败');
    }
  }

  @ApiOperation({ summary: '更新用户反馈' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateFeedbackDto) {
    const result = await this.feedbackService.updateFeedback(id, updateData);
    if (result) {
      return ResponseUtil.success('用户反馈更新成功');
    } else {
      return ResponseUtil.error('用户反馈更新失败');
    }
  }

  @ApiOperation({ summary: '删除用户反馈' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.feedbackService.deleteFeedback(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.feedbackService.batchDeleteFeedback(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '用户反馈统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.feedbackService.getFeedbackStatistics();
    return ResponseUtil.success(statistics);
  }
}