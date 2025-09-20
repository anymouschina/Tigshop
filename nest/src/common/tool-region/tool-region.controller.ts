// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ToolRegionService } from './tool-region.service';
import { CreateToolRegionDto, UpdateToolRegionDto, QueryToolRegionDto } from './dto/tool-region.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('地区工具管理')
@Controller('admin/common/tool-region')
@UseGuards(AdminAuthGuard)
export class ToolRegionController {
  constructor(private readonly toolregionService: ToolRegionService) {}

  @ApiOperation({ summary: '地区工具列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryToolRegionDto) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.toolregionService.getFilterList(filter);
    const total = await this.toolregionService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '地区工具详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.toolregionService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建地区工具' })
  @Post('create')
  async create(@Body() createData: CreateToolRegionDto) {
    const result = await this.toolregionService.createToolRegion(createData);
    if (result) {
      return ResponseUtil.success('地区工具创建成功');
    } else {
      return ResponseUtil.error('地区工具创建失败');
    }
  }

  @ApiOperation({ summary: '更新地区工具' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateToolRegionDto) {
    const result = await this.toolregionService.updateToolRegion(id, updateData);
    if (result) {
      return ResponseUtil.success('地区工具更新成功');
    } else {
      return ResponseUtil.error('地区工具更新失败');
    }
  }

  @ApiOperation({ summary: '删除地区工具' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.toolregionService.deleteToolRegion(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.toolregionService.batchDeleteToolRegion(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '地区工具统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.toolregionService.getToolRegionStatistics();
    return ResponseUtil.success(statistics);
  }
}
