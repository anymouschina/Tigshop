import { Controller, Get, Post, Body, Param, Delete, Query, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OauthService } from './oauth.service';
import {
  OauthQueryDto,
  OauthDetailDto,
  CreateOauthDto,
  UpdateOauthDto,
  DeleteOauthDto,
  BatchDeleteOauthDto,
  OAUTH_TYPE,
  OAUTH_STATUS
} from './oauth.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('系统管理-OAuth管理')
@Controller('admin/oauth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Get()
  @ApiOperation({ summary: '获取OAuth配置列表' })
  @ApiQuery({ name: 'keyword', description: '关键词搜索', required: false })
  @ApiQuery({ name: 'type', description: 'OAuth类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  async findAll(@Query() query: OauthQueryDto) {
    return await this.oauthService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取OAuth配置详情' })
  @ApiParam({ name: 'id', description: 'OAuth ID' })
  async findOne(@Param('id') id: number) {
    return await this.oauthService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建OAuth配置' })
  async create(@Body() createOauthDto: CreateOauthDto) {
    return await this.oauthService.create(createOauthDto);
  }

  @Put()
  @ApiOperation({ summary: '更新OAuth配置' })
  async update(@Body() updateOauthDto: UpdateOauthDto) {
    return await this.oauthService.update(updateOauthDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除OAuth配置' })
  @ApiParam({ name: 'id', description: 'OAuth ID' })
  async remove(@Param('id') id: number) {
    return await this.oauthService.remove(id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除OAuth配置' })
  async batchRemove(@Body() batchDeleteOauthDto: BatchDeleteOauthDto) {
    return await this.oauthService.batchRemove(batchDeleteOauthDto.ids);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新OAuth状态' })
  @ApiParam({ name: 'id', description: 'OAuth ID' })
  @ApiQuery({ name: 'status', description: '状态', required: true })
  async updateStatus(
    @Param('id') id: number,
    @Query('status') status: number,
  ) {
    return await this.oauthService.updateStatus(id, status);
  }

  @Get('type/list')
  @ApiOperation({ summary: '获取OAuth类型列表' })
  async getTypeList() {
    return OAUTH_TYPE;
  }

  @Get('status/list')
  @ApiOperation({ summary: '获取OAuth状态列表' })
  async getStatusList() {
    return OAUTH_STATUS;
  }

  @Get('stats/info')
  @ApiOperation({ summary: '获取OAuth统计信息' })
  async getOauthStats() {
    return await this.oauthService.getOauthStats();
  }
}