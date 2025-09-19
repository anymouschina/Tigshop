import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ProductGiftService } from './product-gift.service';
import { CreateProductGiftDto, UpdateProductGiftDto, QueryProductGiftDto } from './dto/product-gift.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('活动赠品')
@Controller('admin/promotion/product-gift')
@UseGuards(AdminAuthGuard)
export class ProductGiftController {
  constructor(private readonly productGiftService: ProductGiftService) {}

  @ApiOperation({ summary: '活动赠品列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'gift_id', description: '赠品ID', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryProductGiftDto) {
    const filter = {
      keyword: query.keyword || '',
      gift_id: query.gift_id || 0,
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'gift_id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.productGiftService.getFilterResult(filter);
    const total = await this.productGiftService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '活动赠品详情' })
  @ApiParam({ name: 'giftId', description: '赠品ID' })
  @Get('detail/:giftId')
  async detail(@Param('giftId') giftId: number) {
    const item = await this.productGiftService.getDetail(giftId);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建活动赠品' })
  @Post('create')
  async create(@Body() createData: CreateProductGiftDto) {
    const result = await this.productGiftService.createProductGift(createData);
    if (!result) {
      return ResponseUtil.error('添加赠品失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '更新活动赠品' })
  @Put('update')
  async update(@Body() updateData: UpdateProductGiftDto) {
    const result = await this.productGiftService.updateProductGift(updateData);
    if (!result) {
      return ResponseUtil.error('更新赠品失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '删除活动赠品' })
  @ApiParam({ name: 'giftId', description: '赠品ID' })
  @Delete('del/:giftId')
  async del(@Param('giftId') giftId: number) {
    await this.productGiftService.deleteProductGift(giftId);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '赠品统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.productGiftService.getGiftStatistics();
    return ResponseUtil.success(statistics);
  }

  @ApiOperation({ summary: '获取可用赠品列表' })
  @ApiQuery({ name: 'product_id', description: '商品ID', required: false })
  @Get('available')
  async available(@Query('product_id') productId?: number) {
    const gifts = await this.productGiftService.getAvailableGifts(productId);
    return ResponseUtil.success(gifts);
  }
}