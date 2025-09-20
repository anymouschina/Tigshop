import { Controller, Get, Post, Body, Param, Delete, Query, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminLogService } from './admin-log.service';
import {
  AdminLogQueryDto,
  AdminLogDetailDto,
  CreateAdminLogDto,
  DeleteAdminLogDto,
  BatchDeleteAdminLogDto,
  ADMIN_LOG_TYPE,
  ADMIN_LOG_MODULE
} from './admin-log.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('系统管理-管理员日志')
@Controller('admin/admin-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminLogController {
  constructor(private readonly adminLogService: AdminLogService) {}

  @Get()
  @ApiOperation({ summary: '获取管理员日志列表' })
  @ApiQuery({ name: 'keyword', description: '关键词搜索', required: false })
  @ApiQuery({ name: 'admin_id', description: '管理员ID', required: false })
  @ApiQuery({ name: 'type', description: '日志类型', required: false })
  @ApiQuery({ name: 'module', description: '模块', required: false })
  @ApiQuery({ name: 'start_date', description: '开始日期', required: false })
  @ApiQuery({ name: 'end_date', description: '结束日期', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  async findAll(@Query() query: AdminLogQueryDto) {
    return await this.adminLogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取管理员日志详情' })
  @ApiParam({ name: 'id', description: '日志ID' })
  async findOne(@Param('id') id: number) {
    return await this.adminLogService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建管理员日志' })
  async create(@Body() createAdminLogDto: CreateAdminLogDto) {
    return await this.adminLogService.create(createAdminLogDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除管理员日志' })
  @ApiParam({ name: 'id', description: '日志ID' })
  async remove(@Param('id') id: number) {
    return await this.adminLogService.remove(id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除管理员日志' })
  async batchRemove(@Body() batchDeleteAdminLogDto: BatchDeleteAdminLogDto) {
    return await this.adminLogService.batchRemove(batchDeleteAdminLogDto.ids);
  }

  @Get('type/list')
  @ApiOperation({ summary: '获取日志类型列表' })
  async getTypeList() {
    return ADMIN_LOG_TYPE;
  }

  @Get('module/list')
  @ApiOperation({ summary: '获取模块列表' })
  async getModuleList() {
    return ADMIN_LOG_MODULE;
  }

  @Get('stats/operations')
  @ApiOperation({ summary: '获取操作统计' })
  @ApiQuery({ name: 'admin_id', description: '管理员ID', required: false })
  @ApiQuery({ name: 'start_date', description: '开始日期', required: false })
  @ApiQuery({ name: 'end_date', description: '结束日期', required: false })
  async getOperationStats(
    @Query('admin_id') adminId?: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return await this.adminLogService.getOperationStats(adminId, startDate, endDate);
  }

  @Get('stats/active-admins')
  @ApiOperation({ summary: '获取活跃管理员统计' })
  @ApiQuery({ name: 'days', description: '统计天数', required: false })
  async getActiveAdminsStats(@Query('days') days: number = 30) {
    return await this.adminLogService.getActiveAdminsStats(days);
  }
}