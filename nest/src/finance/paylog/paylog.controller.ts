import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { PaylogService } from './paylog.service';
import { BatchDeleteDto } from './dto/paylog.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('交易日志')
@Controller('admin/finance/paylog')
@UseGuards(AdminAuthGuard)
export class PaylogController {
  constructor(private readonly paylogService: PaylogService) {}

  @ApiOperation({ summary: '交易日志列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'pay_status', description: '支付状态', required: false })
  @ApiQuery({ name: 'order_id', description: '订单ID', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: any) {
    const filter = {
      keyword: query.keyword || '',
      pay_status: query.pay_status || -1,
      order_id: query.order_id || 0,
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'paylog_id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.paylogService.getFilterResult(filter);
    const total = await this.paylogService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '交易日志详情' })
  @ApiParam({ name: 'id', description: '交易日志ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.paylogService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '删除交易日志' })
  @ApiParam({ name: 'id', description: '交易日志ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.paylogService.deletePaylog(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: BatchDeleteDto) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.paylogService.batchDeletePaylog(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '支付统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.paylogService.getPayStatistics();
    return ResponseUtil.success(statistics);
  }

  @ApiOperation({ summary: '支付方式统计' })
  @Get('payment-method-stats')
  async paymentMethodStats() {
    const stats = await this.paylogService.getPaymentMethodStats();
    return ResponseUtil.success(stats);
  }
}