// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards } from '@nestjs/common';
import { SeckillService, SECKILL_STATUS_NAME } from './seckill.service';
import {
  SeckillQueryDto,
  SeckillDetailDto,
  CreateSeckillDto,
  UpdateSeckillDto,
  UpdateSeckillFieldDto,
  DeleteSeckillDto,
  BatchDeleteSeckillDto,
} from './dto/seckill.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('秒杀活动管理')
@Controller('admin/seckill')
@UseGuards(RolesGuard)
@Roles('admin')
export class SeckillController {
  constructor(private readonly seckillService: SeckillService) {}

  @Get()
  @ApiOperation({ summary: '获取秒杀活动列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'status', required: false, description: '状态' })
  @ApiQuery({ name: 'shop_id', required: false, description: '店铺ID' })
  @ApiQuery({ name: 'add_time', required: false, description: '创建时间范围' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSeckillList(@Query() query: SeckillQueryDto) {
    const filter = {
      ...query,
      shop_id: query.shop_id || 1, // TODO: 从token中获取
    };

    const [records, total] = await Promise.all([
      this.seckillService.getFilterResult(filter),
      this.seckillService.getFilterCount(filter),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
        status_list: SECKILL_STATUS_NAME,
      },
    };
  }

  @Get('detail')
  @ApiOperation({ summary: '获取秒杀活动详情' })
  @ApiQuery({ name: 'id', required: true, description: '秒杀活动ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSeckillDetail(@Query() query: SeckillDetailDto) {
    const item = await this.seckillService.getDetail(query.id);

    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建秒杀活动' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createSeckill(@Body() createDto: CreateSeckillDto) {
    const result = await this.seckillService.create(createDto);

    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: '更新秒杀活动' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateSeckill(@Body() updateDto: UpdateSeckillDto) {
    const result = await this.seckillService.update(updateDto.seckill_id, updateDto);

    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put('field')
  @ApiOperation({ summary: '更新秒杀活动字段' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateSeckillField(@Body() updateDto: UpdateSeckillFieldDto) {
    const result = await this.seckillService.updateField(updateDto.id, updateDto.field, updateDto.value);

    if (result) {
      return {
        code: 200,
        message: '更新成功',
      };
    } else {
      return {
        code: 400,
        message: '更新失败',
      };
    }
  }

  @Delete()
  @ApiOperation({ summary: '删除秒杀活动' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteSeckill(@Body() deleteDto: DeleteSeckillDto) {
    const result = await this.seckillService.delete(deleteDto.id);

    if (result) {
      return {
        code: 200,
        message: '删除成功',
      };
    } else {
      return {
        code: 400,
        message: '删除失败',
      };
    }
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除秒杀活动' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDeleteSeckill(@Body() batchDto: BatchDeleteSeckillDto) {
    const result = await this.seckillService.batchDelete(batchDto.ids);

    if (result) {
      return {
        code: 200,
        message: '删除成功',
      };
    } else {
      return {
        code: 400,
        message: '删除失败',
      };
    }
  }
}
