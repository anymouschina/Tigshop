import { Controller, Get, Put, Query, Body, Param, UseGuards } from '@nestjs/common';
import { AftersalesService, AFTERSALES_TYPE_NAME, STATUS_NAME } from './aftersales.service';
import {
  AftersalesQueryDto,
  AftersalesDetailDto,
  UpdateAftersalesDto,
  CompleteAftersalesDto,
} from './dto/aftersales.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('售后管理')
@Controller('admin/aftersales')
@UseGuards(RolesGuard)
@Roles('admin')
export class AftersalesController {
  constructor(private readonly aftersalesService: AftersalesService) {}

  @Get()
  @ApiOperation({ summary: '获取售后列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'status', required: false, description: '状态' })
  @ApiQuery({ name: 'aftersale_type', required: false, description: '售后类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAftersalesList(@Query() query: AftersalesQueryDto) {
    const filter = {
      ...query,
      shop_id: 1, // TODO: 从token中获取
      vendor_id: 1, // TODO: 从token中获取
    };

    const [records, total] = await Promise.all([
      this.aftersalesService.getFilterResult(filter),
      this.aftersalesService.getFilterCount(filter),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
        status_list: STATUS_NAME,
      },
    };
  }

  @Get('apply-type')
  @ApiOperation({ summary: '获取售后类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getApplyType() {
    return {
      code: 200,
      message: '获取成功',
      data: AFTERSALES_TYPE_NAME,
    };
  }

  @Get('return-goods-status')
  @ApiOperation({ summary: '获取售后状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getReturnGoodsStatus() {
    const result = { ...STATUS_NAME };

    // 如果不是供应商模式，移除供应商相关状态
    const isVendor = 0; // TODO: 从配置中获取
    if (isVendor !== 1) {
      delete result[21];
      delete result[22];
      delete result[23];
    }

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  @Get('detail')
  @ApiOperation({ summary: '获取售后详情' })
  @ApiQuery({ name: 'id', required: true, description: '售后ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAftersalesDetail(@Query() query: AftersalesDetailDto) {
    const item = await this.aftersalesService.getDetail(query.id);

    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @Put()
  @ApiOperation({ summary: '同意或拒绝售后' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async updateAftersales(@Body() updateDto: UpdateAftersalesDto) {
    const result = await this.aftersalesService.agreeOrRefuse(
      updateDto.aftersale_id,
      updateDto,
    );

    if (result) {
      return {
        code: 200,
        message: '操作成功',
      };
    } else {
      return {
        code: 400,
        message: '操作失败',
      };
    }
  }

  @Put('complete')
  @ApiOperation({ summary: '售后完结' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async completeAftersales(@Body() completeDto: CompleteAftersalesDto) {
    const result = await this.aftersalesService.complete(
      completeDto.id,
      completeDto.admin_id,
    );

    if (result) {
      return {
        code: 200,
        message: '操作成功',
      };
    } else {
      return {
        code: 400,
        message: '操作失败',
      };
    }
  }
}