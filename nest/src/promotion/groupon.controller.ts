// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards } from '@nestjs/common';
import { GrouponService, GROUPON_STATUS_NAME } from './groupon.service';
import {
  GrouponQueryDto,
  GrouponDetailDto,
  CreateGrouponDto,
  UpdateGrouponDto,
  DeleteGrouponDto,
  BatchDeleteGrouponDto,
} from './dto/groupon.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('拼团活动管理')
@Controller('admin/groupon')
@UseGuards(RolesGuard)
@Roles('admin')
export class GrouponController {
  constructor(private readonly grouponService: GrouponService) {}

  @Get()
  @ApiOperation({ summary: '获取拼团活动列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'status', required: false, description: '状态' })
  @ApiQuery({ name: 'shop_id', required: false, description: '店铺ID' })
  @ApiQuery({ name: 'add_time', required: false, description: '创建时间范围' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getGrouponList(@Query() query: GrouponQueryDto) {
    const filter = {
      ...query,
      shop_id: query.shop_id !== undefined ? query.shop_id : 1, // TODO: 从token中获取
    };

    const [records, total] = await Promise.all([
      this.grouponService.getFilterResult(filter),
      this.grouponService.getFilterCount(filter),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
        status_list: GROUPON_STATUS_NAME,
      },
    };
  }

  @Get('detail')
  @ApiOperation({ summary: '获取拼团活动详情' })
  @ApiQuery({ name: 'id', required: true, description: '拼团活动ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getGrouponDetail(@Query() query: GrouponDetailDto) {
    const item = await this.grouponService.getDetail(query.id);

    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建拼团活动' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createGroupon(@Body() createDto: CreateGrouponDto) {
    const result = await this.grouponService.create(createDto);

    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: '更新拼团活动' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateGroupon(@Body() updateDto: UpdateGrouponDto) {
    const result = await this.grouponService.update(updateDto.product_team_id, updateDto);

    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Delete()
  @ApiOperation({ summary: '删除拼团活动' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteGroupon(@Body() deleteDto: DeleteGrouponDto) {
    const result = await this.grouponService.delete(deleteDto.id);

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
  @ApiOperation({ summary: '批量删除拼团活动' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDeleteGroupon(@Body() batchDto: BatchDeleteGrouponDto) {
    const result = await this.grouponService.batchDelete(batchDto.ids);

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
