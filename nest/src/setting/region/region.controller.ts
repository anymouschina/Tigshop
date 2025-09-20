// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { RegionService } from './region.service';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('地区管理')
@Controller('admin/setting/region')
@UseGuards(AdminAuthGuard)
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @ApiOperation({ summary: '地区列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'parent_id', description: '父级ID', required: false })
  @ApiQuery({ name: 'level', description: '级别', required: false })
  @Get('list')
  async list(@Query() query: any) {
    const filter = {
      keyword: query.keyword || '',
      parent_id: query.parent_id || 0,
      level: query.level || '',
    };

    const filterResult = await this.regionService.getFilterList(filter);
    return ResponseUtil.success(filterResult);
  }

  @ApiOperation({ summary: '地区树形结构' })
  @Get('tree')
  async tree() {
    const tree = await this.regionService.getRegionTree();
    return ResponseUtil.success(tree);
  }

  @ApiOperation({ summary: '地区详情' })
  @ApiParam({ name: 'id', description: '地区ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.regionService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建地区' })
  @Post('create')
  async create(@Body() createData: CreateRegionDto) {
    const result = await this.regionService.createRegion(createData);
    if (!result) {
      return ResponseUtil.error('地区创建失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '更新地区' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateRegionDto) {
    const result = await this.regionService.updateRegion(id, updateData);
    if (!result) {
      return ResponseUtil.error('地区更新失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '删除地区' })
  @ApiParam({ name: 'id', description: '地区ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.regionService.deleteRegion(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '获取子地区' })
  @ApiParam({ name: 'parentId', description: '父级ID' })
  @Get('children/:parentId')
  async children(@Param('parentId') parentId: number) {
    const children = await this.regionService.getChildren(parentId);
    return ResponseUtil.success(children);
  }

  @ApiOperation({ summary: '搜索地区' })
  @ApiQuery({ name: 'keyword', description: '关键词' })
  @Get('search')
  async search(@Query('keyword') keyword: string) {
    const results = await this.regionService.searchRegions(keyword);
    return ResponseUtil.success(results);
  }
}
