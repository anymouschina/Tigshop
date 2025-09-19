import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ProductPromotionService } from './product-promotion.service';
import { CreateProductPromotionDto, UpdateProductPromotionDto, QueryProductPromotionDto } from './dto/product-promotion.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('优惠活动')
@Controller('admin/promotion/product-promotion')
@UseGuards(AdminAuthGuard)
export class ProductPromotionController {
  constructor(private readonly productPromotionService: ProductPromotionService) {}

  @ApiOperation({ summary: '优惠活动列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'promotion_type', description: '活动类型', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'is_going', description: '是否进行中', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryProductPromotionDto) {
    const filter = {
      keyword: query.keyword || '',
      promotion_type: query.promotion_type || '',
      page: query.page || 1,
      size: query.size || 15,
      is_going: query.is_going || '',
      sort_field: query.sort_field || 'promotion_id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.productPromotionService.getFilterResult(filter);
    const total = await this.productPromotionService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '获取活动冲突列表' })
  @ApiQuery({ name: 'start_time', description: '开始时间', required: false })
  @ApiQuery({ name: 'end_time', description: '结束时间', required: false })
  @ApiQuery({ name: 'range', description: '范围', required: false })
  @ApiQuery({ name: 'range_data', description: '范围数据', required: false })
  @ApiQuery({ name: 'promotion_type', description: '活动类型', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @Get('conflict-list')
  async conflictList(@Query() query: any) {
    const filter = {
      start_time: query.start_time || '',
      end_time: query.end_time || '',
      range: query.range || 0,
      range_data: query.range_data || '',
      promotion_type: query.promotion_type || 0,
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'promotion_id',
      sort_order: query.sort_order || 'desc',
    };

    if (filter.range_data) {
      filter.range_data = filter.range_data.split(',');
    }

    const filterResult = await this.productPromotionService.getConflictList(filter);

    return ResponseUtil.success({
      records: filterResult.list,
      total: filterResult.total,
    });
  }

  @ApiOperation({ summary: '优惠活动配置' })
  @Get('config')
  async config() {
    const rankList = await this.productPromotionService.getUserRankList();
    const promotionStatus = await this.productPromotionService.getPromotionStatus();

    return ResponseUtil.success({
      rank_list: rankList,
      promotion_status: promotionStatus,
    });
  }

  @ApiOperation({ summary: '优惠活动详情' })
  @ApiParam({ name: 'id', description: '活动ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.productPromotionService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建优惠活动' })
  @Post('create')
  async create(@Body() createData: CreateProductPromotionDto) {
    const result = await this.productPromotionService.createProductPromotion(createData);
    if (!result) {
      return ResponseUtil.error('优惠活动创建失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '更新优惠活动' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateProductPromotionDto) {
    const result = await this.productPromotionService.updateProductPromotion(id, updateData);
    if (!result) {
      return ResponseUtil.error('优惠活动更新失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '更新单个字段' })
  @Put('update-field')
  async updateField(@Body() updateData: { id: number; field: string; val: any }) {
    const { id, field, val } = updateData;

    if (!['sort_order', 'is_available'].includes(field)) {
      return ResponseUtil.error('#field 错误');
    }

    await this.productPromotionService.updateProductPromotionField(id, { [field]: val });
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '删除优惠活动' })
  @ApiParam({ name: 'id', description: '活动ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.productPromotionService.deleteProductPromotion(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.productPromotionService.batchDeleteProductPromotion(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '优惠活动统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.productPromotionService.getPromotionStatistics();
    return ResponseUtil.success(statistics);
  }
}