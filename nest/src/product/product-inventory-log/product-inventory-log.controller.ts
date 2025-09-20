import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ProductInventoryLogService } from './product-inventory-log.service';
import { CreateProductInventoryLogDto, UpdateProductInventoryLogDto, QueryProductInventoryLogDto } from './dto/product-inventory-log.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('产品库存日志管理')
@Controller('admin/product/product-inventory-log')
@UseGuards(AdminAuthGuard)
export class ProductInventoryLogController {
  constructor(private readonly productinventorylogService: ProductInventoryLogService) {}

  @ApiOperation({ summary: '产品库存日志列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryProductInventoryLogDto) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.productinventorylogService.getFilterList(filter);
    const total = await this.productinventorylogService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '产品库存日志详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.productinventorylogService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建产品库存日志' })
  @Post('create')
  async create(@Body() createData: CreateProductInventoryLogDto) {
    const result = await this.productinventorylogService.createProductInventoryLog(createData);
    if (result) {
      return ResponseUtil.success('产品库存日志创建成功');
    } else {
      return ResponseUtil.error('产品库存日志创建失败');
    }
  }

  @ApiOperation({ summary: '更新产品库存日志' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateProductInventoryLogDto) {
    const result = await this.productinventorylogService.updateProductInventoryLog(id, updateData);
    if (result) {
      return ResponseUtil.success('产品库存日志更新成功');
    } else {
      return ResponseUtil.error('产品库存日志更新失败');
    }
  }

  @ApiOperation({ summary: '删除产品库存日志' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.productinventorylogService.deleteProductInventoryLog(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.productinventorylogService.batchDeleteProductInventoryLog(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '产品库存日志统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.productinventorylogService.getProductInventoryLogStatistics();
    return ResponseUtil.success(statistics);
  }
}