import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { OrderInvoiceService } from './order-invoice.service';
import { CreateOrderInvoiceDto, UpdateOrderInvoiceDto, QueryOrderInvoiceDto } from './dto/order-invoice.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('发票申请')
@Controller('admin/finance/order-invoice')
@UseGuards(AdminAuthGuard)
export class OrderInvoiceController {
  constructor(private readonly orderInvoiceService: OrderInvoiceService) {}

  @ApiOperation({ summary: '发票申请列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'invoice_type', description: '发票类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'shop_type', description: '店铺类型', required: false })
  @ApiQuery({ name: 'shop_id', description: '店铺ID', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryOrderInvoiceDto) {
    const filter = {
      keyword: query.keyword || '',
      invoice_type: query.invoice_type || 0,
      status: query.status || -1,
      shop_type: query.shop_type || 0,
      shop_id: query.shop_id || -1,
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.orderInvoiceService.getFilterResult(filter);
    const total = await this.orderInvoiceService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '发票申请详情' })
  @ApiParam({ name: 'id', description: '发票申请ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.orderInvoiceService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '更新发票申请' })
  @Put('update')
  async update(@Body() updateData: UpdateOrderInvoiceDto) {
    const result = await this.orderInvoiceService.updateOrderInvoice(updateData.id, updateData);
    if (!result) {
      return ResponseUtil.error('发票申请更新失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '删除发票申请' })
  @ApiParam({ name: 'id', description: '发票申请ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.orderInvoiceService.deleteOrderInvoice(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.orderInvoiceService.batchDeleteOrderInvoice(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '创建发票申请' })
  @Post('create')
  async create(@Body() createData: CreateOrderInvoiceDto) {
    const result = await this.orderInvoiceService.createOrderInvoice(createData);
    if (!result) {
      return ResponseUtil.error('发票申请创建失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '发票统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.orderInvoiceService.getInvoiceStatistics();
    return ResponseUtil.success(statistics);
  }

  @ApiOperation({ summary: '发票下载' })
  @ApiParam({ name: 'id', description: '发票申请ID' })
  @Get('download/:id')
  async download(@Param('id') id: number) {
    const invoice = await this.orderInvoiceService.getDetail(id);
    if (!invoice) {
      return ResponseUtil.error('发票不存在');
    }
    // 这里应该返回文件下载链接
    return ResponseUtil.success({
      download_url: invoice.invoice_attachment,
    });
  }
}