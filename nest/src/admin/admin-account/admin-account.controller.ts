import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { AdminAccountService } from './admin-account.service';
import { CreateAdminAccountDto, UpdateAdminAccountDto, QueryAdminAccountDto } from './dto/admin-account.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('管理员账户管理')
@Controller('admin/admin/admin-account')
@UseGuards(AdminAuthGuard)
export class AdminAccountController {
  constructor(private readonly adminaccountService: AdminAccountService) {}

  @ApiOperation({ summary: '管理员账户列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryAdminAccountDto) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.adminaccountService.getFilterList(filter);
    const total = await this.adminaccountService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '管理员账户详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.adminaccountService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建管理员账户' })
  @Post('create')
  async create(@Body() createData: CreateAdminAccountDto) {
    const result = await this.adminaccountService.createAdminAccount(createData);
    if (result) {
      return ResponseUtil.success('管理员账户创建成功');
    } else {
      return ResponseUtil.error('管理员账户创建失败');
    }
  }

  @ApiOperation({ summary: '更新管理员账户' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateAdminAccountDto) {
    const result = await this.adminaccountService.updateAdminAccount(id, updateData);
    if (result) {
      return ResponseUtil.success('管理员账户更新成功');
    } else {
      return ResponseUtil.error('管理员账户更新失败');
    }
  }

  @ApiOperation({ summary: '删除管理员账户' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.adminaccountService.deleteAdminAccount(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.adminaccountService.batchDeleteAdminAccount(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '管理员账户统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.adminaccountService.getAdminAccountStatistics();
    return ResponseUtil.success(statistics);
  }
}