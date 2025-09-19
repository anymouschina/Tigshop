import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { UserPointsLogService } from './user-points-log.service';
import { CreateUserPointsLogDto, BatchDeleteDto } from './dto/user-points-log.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('积分日志')
@Controller('admin/user/points-log')
@UseGuards(AdminAuthGuard)
export class UserPointsLogController {
  constructor(private readonly userPointsLogService: UserPointsLogService) {}

  @ApiOperation({ summary: '积分日志列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: any) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'log_id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.userPointsLogService.getFilterResult(filter);
    const total = await this.userPointsLogService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '获取当前用户积分' })
  @ApiQuery({ name: 'user_id', description: '用户ID' })
  @Get('get-points')
  async getPoints(@Query('user_id') userId: number) {
    const user = await this.userPointsLogService.getUserById(userId);
    return ResponseUtil.success([user.points]);
  }

  @ApiOperation({ summary: '删除积分日志' })
  @ApiParam({ name: 'id', description: '日志ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.userPointsLogService.deleteUserPointsLog(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: BatchDeleteDto) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.userPointsLogService.batchDeleteUserPointsLog(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '创建积分日志' })
  @Post('create')
  async create(@Body() createData: CreateUserPointsLogDto) {
    const result = await this.userPointsLogService.createUserPointsLog(createData);
    if (!result) {
      return ResponseUtil.error('创建失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '积分日志详情' })
  @ApiParam({ name: 'id', description: '日志ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.userPointsLogService.getDetail(id);
    return ResponseUtil.success(item);
  }
}