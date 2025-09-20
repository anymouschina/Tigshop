import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ProductServicesService } from './product-services.service';
import { CreateProductServicesDto, UpdateProductServicesDto, QueryProductServicesDto } from './dto/product-services.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('产品服务管理')
@Controller('admin/product/product-services')
@UseGuards(AdminAuthGuard)
export class ProductServicesController {
  constructor(private readonly productservicesService: ProductServicesService) {}

  @ApiOperation({ summary: '产品服务列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryProductServicesDto) {
    const filter = {
      keyword: query.keyword || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.productservicesService.getFilterList(filter);
    const total = await this.productservicesService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '产品服务详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.productservicesService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建产品服务' })
  @Post('create')
  async create(@Body() createData: CreateProductServicesDto) {
    const result = await this.productservicesService.createProductServices(createData);
    if (result) {
      return ResponseUtil.success('产品服务创建成功');
    } else {
      return ResponseUtil.error('产品服务创建失败');
    }
  }

  @ApiOperation({ summary: '更新产品服务' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateProductServicesDto) {
    const result = await this.productservicesService.updateProductServices(id, updateData);
    if (result) {
      return ResponseUtil.success('产品服务更新成功');
    } else {
      return ResponseUtil.error('产品服务更新失败');
    }
  }

  @ApiOperation({ summary: '删除产品服务' })
  @ApiParam({ name: 'id', description: 'ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.productservicesService.deleteProductServices(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.productservicesService.batchDeleteProductServices(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '产品服务统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.productservicesService.getProductServicesStatistics();
    return ResponseUtil.success(statistics);
  }
}