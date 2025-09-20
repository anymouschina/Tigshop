import { Controller, Get, Post, Body, Param, Delete, Query, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminRoleService } from './admin-role.service';
import {
  AdminRoleQueryDto,
  AdminRoleDetailDto,
  CreateAdminRoleDto,
  UpdateAdminRoleDto,
  DeleteAdminRoleDto,
  BatchDeleteAdminRoleDto,
  ROLE_STATUS
} from './admin-role.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('系统管理-管理员角色')
@Controller('admin/admin-role')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminRoleController {
  constructor(private readonly adminRoleService: AdminRoleService) {}

  @Get()
  @ApiOperation({ summary: '获取管理员角色列表' })
  @ApiQuery({ name: 'keyword', description: '关键词搜索', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  async findAll(@Query() query: AdminRoleQueryDto) {
    return await this.adminRoleService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取管理员角色详情' })
  @ApiParam({ name: 'id', description: '角色ID' })
  async findOne(@Param('id') id: number) {
    return await this.adminRoleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建管理员角色' })
  async create(@Body() createAdminRoleDto: CreateAdminRoleDto) {
    return await this.adminRoleService.create(createAdminRoleDto);
  }

  @Put()
  @ApiOperation({ summary: '更新管理员角色' })
  async update(@Body() updateAdminRoleDto: UpdateAdminRoleDto) {
    return await this.adminRoleService.update(updateAdminRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除管理员角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  async remove(@Param('id') id: number) {
    return await this.adminRoleService.remove(id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除管理员角色' })
  async batchRemove(@Body() batchDeleteAdminRoleDto: BatchDeleteAdminRoleDto) {
    return await this.adminRoleService.batchRemove(batchDeleteAdminRoleDto.ids);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新角色状态' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiQuery({ name: 'status', description: '状态', required: true })
  async updateStatus(
    @Param('id') id: number,
    @Query('status') status: number,
  ) {
    return await this.adminRoleService.updateStatus(id, status);
  }

  @Get('all')
  @ApiOperation({ summary: '获取所有角色' })
  async getAllRoles() {
    return await this.adminRoleService.getAllRoles();
  }

  @Get('status/list')
  @ApiOperation({ summary: '获取角色状态列表' })
  async getStatusList() {
    return ROLE_STATUS;
  }

  @Get('stats/count')
  @ApiOperation({ summary: '获取角色统计' })
  async getRoleStats() {
    return await this.adminRoleService.getRoleStats();
  }
}