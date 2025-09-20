import { Controller, Get, Post, Body, Param, Delete, Query, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthorityService } from './authority.service';
import {
  AuthorityQueryDto,
  AuthorityDetailDto,
  CreateAuthorityDto,
  UpdateAuthorityDto,
  DeleteAuthorityDto,
  BatchDeleteAuthorityDto,
  AUTHORITY_TYPE,
  AUTHORITY_STATUS
} from './authority.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('系统管理-权限管理')
@Controller('admin/authority')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuthorityController {
  constructor(private readonly authorityService: AuthorityService) {}

  @Get()
  @ApiOperation({ summary: '获取权限列表' })
  @ApiQuery({ name: 'keyword', description: '关键词搜索', required: false })
  @ApiQuery({ name: 'parent_id', description: '父级ID', required: false })
  @ApiQuery({ name: 'type', description: '权限类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  async findAll(@Query() query: AuthorityQueryDto) {
    return await this.authorityService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取权限详情' })
  @ApiParam({ name: 'id', description: '权限ID' })
  async findOne(@Param('id') id: number) {
    return await this.authorityService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建权限' })
  async create(@Body() createAuthorityDto: CreateAuthorityDto) {
    return await this.authorityService.create(createAuthorityDto);
  }

  @Put()
  @ApiOperation({ summary: '更新权限' })
  async update(@Body() updateAuthorityDto: UpdateAuthorityDto) {
    return await this.authorityService.update(updateAuthorityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限' })
  @ApiParam({ name: 'id', description: '权限ID' })
  async remove(@Param('id') id: number) {
    return await this.authorityService.remove(id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除权限' })
  async batchRemove(@Body() batchDeleteAuthorityDto: BatchDeleteAuthorityDto) {
    return await this.authorityService.batchRemove(batchDeleteAuthorityDto.ids);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取权限树' })
  @ApiQuery({ name: 'type', description: '权限类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  async getAuthorityTree(
    @Query('type') type?: number,
    @Query('status') status?: number,
  ) {
    return await this.authorityService.getAuthorityTree(type, status);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新权限状态' })
  @ApiParam({ name: 'id', description: '权限ID' })
  @ApiQuery({ name: 'status', description: '状态', required: true })
  async updateStatus(
    @Param('id') id: number,
    @Query('status') status: number,
  ) {
    return await this.authorityService.updateStatus(id, status);
  }

  @Get('type/list')
  @ApiOperation({ summary: '获取权限类型列表' })
  async getTypeList() {
    return AUTHORITY_TYPE;
  }

  @Get('status/list')
  @ApiOperation({ summary: '获取权限状态列表' })
  async getStatusList() {
    return AUTHORITY_STATUS;
  }

  @Get('menu')
  @ApiOperation({ summary: '获取菜单权限' })
  @ApiQuery({ name: 'role_id', description: '角色ID', required: false })
  async getMenuPermissions(@Query('role_id') roleId?: number) {
    return await this.authorityService.getMenuPermissions(roleId);
  }

  @Get('action')
  @ApiOperation({ summary: '获取操作权限' })
  @ApiQuery({ name: 'role_id', description: '角色ID', required: false })
  async getActionPermissions(@Query('role_id') roleId?: number) {
    return await this.authorityService.getActionPermissions(roleId);
  }
}