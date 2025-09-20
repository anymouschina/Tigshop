// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { CreatePrinterDto, UpdatePrinterDto, QueryPrinterDto } from './dto/printer.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('打印机管理')
@Controller('admin/print/printer')
@UseGuards(AdminAuthGuard)
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @ApiOperation({ summary: '打印机列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryPrinterDto) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.printerService.getFilterList(filter);
    const total = await this.printerService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '打印机详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.printerService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建打印机' })
  @Post('create')
  async create(@Body() createData: CreatePrinterDto) {
    const result = await this.printerService.createPrinter(createData);
    if (result) {
      return ResponseUtil.success('打印机创建成功');
    } else {
      return ResponseUtil.error('打印机创建失败');
    }
  }

  @ApiOperation({ summary: '更新打印机' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdatePrinterDto) {
    const result = await this.printerService.updatePrinter(id, updateData);
    if (result) {
      return ResponseUtil.success('打印机更新成功');
    } else {
      return ResponseUtil.error('打印机更新失败');
    }
  }

  @ApiOperation({ summary: '删除打印机' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.printerService.deletePrinter(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.printerService.batchDeletePrinter(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '打印机统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.printerService.getPrinterStatistics();
    return ResponseUtil.success(statistics);
  }
}
