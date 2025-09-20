// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { CreateVerificationDto, UpdateVerificationDto, QueryVerificationDto } from './dto/verification.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('验证码管理')
@Controller('admin/common/verification')
@UseGuards(AdminAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @ApiOperation({ summary: '验证码列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryVerificationDto) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.verificationService.getFilterList(filter);
    const total = await this.verificationService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '验证码详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.verificationService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建验证码' })
  @Post('create')
  async create(@Body() createData: CreateVerificationDto) {
    const result = await this.verificationService.createVerification(createData);
    if (result) {
      return ResponseUtil.success('验证码创建成功');
    } else {
      return ResponseUtil.error('验证码创建失败');
    }
  }

  @ApiOperation({ summary: '更新验证码' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateVerificationDto) {
    const result = await this.verificationService.updateVerification(id, updateData);
    if (result) {
      return ResponseUtil.success('验证码更新成功');
    } else {
      return ResponseUtil.error('验证码更新失败');
    }
  }

  @ApiOperation({ summary: '删除验证码' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.verificationService.deleteVerification(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.verificationService.batchDeleteVerification(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '验证码统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.verificationService.getVerificationStatistics();
    return ResponseUtil.success(statistics);
  }
}
