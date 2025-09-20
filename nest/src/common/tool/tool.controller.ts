// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ToolService } from './tool.service';
import { CreateToolDto, UpdateToolDto, QueryToolDto } from './dto/tool.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('通用工具管理')
@Controller('admin/common/tool')
@UseGuards(AdminAuthGuard)
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @ApiOperation({ summary: '通用工具列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryToolDto) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.toolService.getFilterList(filter);
    const total = await this.toolService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '通用工具详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.toolService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建通用工具' })
  @Post('create')
  async create(@Body() createData: CreateToolDto) {
    const result = await this.toolService.createTool(createData);
    if (result) {
      return ResponseUtil.success('通用工具创建成功');
    } else {
      return ResponseUtil.error('通用工具创建失败');
    }
  }

  @ApiOperation({ summary: '更新通用工具' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateToolDto) {
    const result = await this.toolService.updateTool(id, updateData);
    if (result) {
      return ResponseUtil.success('通用工具更新成功');
    } else {
      return ResponseUtil.error('通用工具更新失败');
    }
  }

  @ApiOperation({ summary: '删除通用工具' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.toolService.deleteTool(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.toolService.batchDeleteTool(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '通用工具统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.toolService.getToolStatistics();
    return ResponseUtil.success(statistics);
  }
}
