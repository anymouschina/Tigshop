// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { UserCompanyService } from './user-company.service';
import { CreateUserCompanyDto, UpdateUserCompanyDto, AuditUserCompanyDto, QueryUserCompanyDto } from './dto/user-company.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('企业管理')
@Controller('admin/user/company')
@UseGuards(AdminAuthGuard)
export class UserCompanyController {
  constructor(private readonly userCompanyService: UserCompanyService) {}

  @ApiOperation({ summary: '企业认证列表' })
  @ApiQuery({ name: 'username', description: '用户名', required: false })
  @ApiQuery({ name: 'type', description: '类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryUserCompanyDto) {
    const filter = {
      username: query.username || '',
      type: query.type || 0,
      status: query.status || 0,
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.userCompanyService.getFilterList(filter, ['user'], ['status_text', 'type_text']);
    const total = await this.userCompanyService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '企业认证详情' })
  @ApiParam({ name: 'id', description: '企业认证ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.userCompanyService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '企业认证审核' })
  @Put('audit')
  async audit(@Body() auditData: AuditUserCompanyDto) {
    const result = await this.userCompanyService.audit(auditData.id, auditData);
    if (!result) {
      return ResponseUtil.error('会员企业认证审核失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '删除企业认证' })
  @ApiParam({ name: 'id', description: '企业认证ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    const result = await this.userCompanyService.del(id);
    if (!result) {
      return ResponseUtil.error('删除失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '创建企业认证' })
  @Post('create')
  async create(@Body() createDto: CreateUserCompanyDto) {
    const result = await this.userCompanyService.create(createDto);
    if (!result) {
      return ResponseUtil.error('创建失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '更新企业认证' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateDto: UpdateUserCompanyDto) {
    const result = await this.userCompanyService.update(id, updateDto);
    if (!result) {
      return ResponseUtil.error('更新失败');
    }
    return ResponseUtil.success();
  }
}
