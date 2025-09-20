// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto, UpdatePromotionDto, PromotionQueryDto } from './dto/promotion.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('促销管理')
@Controller('admin/promotion')
@UseGuards(RolesGuard)
@Roles('admin')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  @ApiOperation({ summary: '获取促销活动列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'time_type', required: false, description: '时间类型' })
  @ApiQuery({ name: 'type', required: false, description: '活动类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPromotionList(@Query() query: PromotionQueryDto) {
    const filter = {
      ...query,
      shop_id: 1, // TODO: 从token中获取
      is_delete: 0,
      is_available: 1,
    };

    const [records, total] = await Promise.all([
      this.promotionService.getFilterList(filter),
      this.promotionService.getFilterCount(filter)
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
      }
    };
  }

  @Get('count')
  @ApiOperation({ summary: '获取促销活动数量统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPromotionCount() {
    const baseFilter = {
      shop_id: 1, // TODO: 从token中获取
      is_delete: 0,
      is_available: 1,
    };

    const [timeType1Count, timeType2Count, timeType3Count] = await Promise.all([
      this.promotionService.getFilterCount({ ...baseFilter, time_type: 1 }),
      this.promotionService.getFilterCount({ ...baseFilter, time_type: 2 }),
      this.promotionService.getFilterCount({ ...baseFilter, time_type: 3 }),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        timeType1Count,
        timeType2Count,
        timeType3Count,
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取促销活动详情' })
  @ApiParam({ name: 'id', description: '促销活动ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPromotionDetail(@Param('id') id: number) {
    const promotion = await this.promotionService.getDetail(id);
    return {
      code: 200,
      message: '获取成功',
      data: promotion,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建促销活动' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createPromotion(@Body() createPromotionDto: CreatePromotionDto) {
    const result = await this.promotionService.createPromotion(createPromotionDto);
    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新促销活动' })
  @ApiParam({ name: 'id', description: '促销活动ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updatePromotion(
    @Param('id') id: number,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    const result = await this.promotionService.updatePromotion(id, updatePromotionDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put(':id/field')
  @ApiOperation({ summary: '更新促销活动单个字段' })
  @ApiParam({ name: 'id', description: '促销活动ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updatePromotionField(
    @Param('id') id: number,
    @Body() body: { field: string; value: any },
  ) {
    const result = await this.promotionService.updatePromotionField(id, body.field, body.value);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除促销活动' })
  @ApiParam({ name: 'id', description: '促销活动ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deletePromotion(@Param('id') id: number) {
    await this.promotionService.deletePromotion(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  @Post('batch')
  @ApiOperation({ summary: '批量操作促销活动' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async batchOperation(@Body() body: { ids: number[]; type: string }) {
    if (body.type === 'del') {
      await this.promotionService.batchDelete(body.ids);
      return {
        code: 200,
        message: '批量删除成功',
      };
    }
    return {
      code: 400,
      message: '不支持的操作类型',
    };
  }
}
