// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { PriceInquiryService } from './price-inquiry.service';
import { CreatePriceInquiryDto, UpdatePriceInquiryDto, QueryPriceInquiryDto } from './dto/price-inquiry.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('价格查询管理')
@Controller('admin/product/price-inquiry')
@UseGuards(AdminAuthGuard)
export class PriceInquiryController {
  constructor(private readonly priceInquiryService: PriceInquiryService) {}

  @ApiOperation({ summary: '价格查询列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryPriceInquiryDto) {
    const filter = {
      keyword: query.keyword || '',
      status: query.status || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.priceInquiryService.getFilterList(filter);
    const total = await this.priceInquiryService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '价格查询详情' })
  @ApiParam({ name: 'id', description: '查询ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.priceInquiryService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建价格查询' })
  @Post('create')
  async create(@Body() createData: CreatePriceInquiryDto) {
    const result = await this.priceInquiryService.createPriceInquiry(createData);
    if (result) {
      return ResponseUtil.success('价格查询创建成功');
    } else {
      return ResponseUtil.error('价格查询创建失败');
    }
  }

  @ApiOperation({ summary: '更新价格查询' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdatePriceInquiryDto) {
    const result = await this.priceInquiryService.updatePriceInquiry(id, updateData);
    if (result) {
      return ResponseUtil.success('价格查询更新成功');
    } else {
      return ResponseUtil.error('价格查询更新失败');
    }
  }

  @ApiOperation({ summary: '删除价格查询' })
  @ApiParam({ name: 'id', description: '查询ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.priceInquiryService.deletePriceInquiry(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.priceInquiryService.batchDeletePriceInquiry(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '回复价格查询' })
  @Post('reply/:id')
  async reply(@Param('id') id: number, @Body() replyData: any) {
    const result = await this.priceInquiryService.replyPriceInquiry(id, replyData);
    if (result) {
      return ResponseUtil.success('回复成功');
    } else {
      return ResponseUtil.error('回复失败');
    }
  }

  @ApiOperation({ summary: '价格查询统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.priceInquiryService.getPriceInquiryStatistics();
    return ResponseUtil.success(statistics);
  }
}
