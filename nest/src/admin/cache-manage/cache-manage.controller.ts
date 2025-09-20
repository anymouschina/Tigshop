import { Controller, Get, Post, Body, Param, Delete, Query, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CacheManageService } from './cache-manage.service';
import { CacheManageService as GenericCacheManageService } from './cache-manage.service';
import {
  CacheManageQueryDto,
  CacheManageDetailDto,
  CreateCacheManageDto,
  UpdateCacheManageDto,
  DeleteCacheManageDto,
  BatchDeleteCacheManageDto,
  CACHE_TYPE,
  CACHE_STATUS
} from './cache-manage.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('系统管理-缓存管理')
@Controller('admin/cache-manage')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CacheManageController {
  constructor(private readonly cacheManageService: GenericCacheManageService) {}

  @Get()
  @ApiOperation({ summary: '获取缓存管理列表' })
  @ApiQuery({ name: 'keyword', description: '关键词搜索', required: false })
  @ApiQuery({ name: 'type', description: '缓存类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  async findAll(@Query() query: CacheManageQueryDto) {
    return await this.cacheManageService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取缓存管理详情' })
  @ApiParam({ name: 'id', description: '缓存ID' })
  async findOne(@Param('id') id: number) {
    return await this.cacheManageService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建缓存管理' })
  async create(@Body() createCacheManageDto: CreateCacheManageDto) {
    return await this.cacheManageService.create(createCacheManageDto);
  }

  @Put()
  @ApiOperation({ summary: '更新缓存管理' })
  async update(@Body() updateCacheManageDto: UpdateCacheManageDto) {
    return await this.cacheManageService.update(updateCacheManageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除缓存管理' })
  @ApiParam({ name: 'id', description: '缓存ID' })
  async remove(@Param('id') id: number) {
    return await this.cacheManageService.remove(id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除缓存管理' })
  async batchRemove(@Body() batchDeleteCacheManageDto: BatchDeleteCacheManageDto) {
    return await this.cacheManageService.batchRemove(batchDeleteCacheManageDto.ids);
  }

  @Post('clear-all')
  @ApiOperation({ summary: '清空所有缓存' })
  async clearAllCache() {
    return await this.cacheManageService.clearAllCache();
  }

  @Post('clear-type')
  @ApiOperation({ summary: '清空指定类型缓存' })
  @ApiQuery({ name: 'type', description: '缓存类型', required: true })
  async clearTypeCache(@Query('type') type: number) {
    return await this.cacheManageService.clearTypeCache(type);
  }

  @Get('stats/info')
  @ApiOperation({ summary: '获取缓存统计信息' })
  async getCacheStats() {
    return await this.cacheManageService.getCacheStats();
  }

  @Get('type/list')
  @ApiOperation({ summary: '获取缓存类型列表' })
  async getTypeList() {
    return CACHE_TYPE;
  }

  @Get('status/list')
  @ApiOperation({ summary: '获取缓存状态列表' })
  async getStatusList() {
    return CACHE_STATUS;
  }
}