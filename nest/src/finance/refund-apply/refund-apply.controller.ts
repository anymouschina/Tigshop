import { Controller, Get, Post, Body, Param, Delete, Query, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RefundApplyService } from './refund-apply.service';
import {
  RefundApplyQueryDto,
  RefundApplyDetailDto,
  CreateRefundApplyDto,
  UpdateRefundApplyDto,
  DeleteRefundApplyDto,
  BatchDeleteRefundApplyDto,
  REFUND_APPLY_STATUS
} from './refund-apply.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('财务管理-退款申请')
@Controller('admin/finance/refund-apply')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RefundApplyController {
  constructor(private readonly refundApplyService: RefundApplyService) {}

  @Get()
  @ApiOperation({ summary: '获取退款申请列表' })
  @ApiQuery({ name: 'keyword', description: '关键词搜索', required: false })
  @ApiQuery({ name: 'user_id', description: '用户ID', required: false })
  @ApiQuery({ name: 'order_id', description: '订单ID', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  async findAll(@Query() query: RefundApplyQueryDto) {
    return await this.refundApplyService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取退款申请详情' })
  @ApiParam({ name: 'id', description: '退款申请ID' })
  async findOne(@Param('id') id: number) {
    return await this.refundApplyService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建退款申请' })
  async create(@Body() createRefundApplyDto: CreateRefundApplyDto) {
    return await this.refundApplyService.create(createRefundApplyDto);
  }

  @Put()
  @ApiOperation({ summary: '更新退款申请' })
  async update(@Body() updateRefundApplyDto: UpdateRefundApplyDto) {
    return await this.refundApplyService.update(updateRefundApplyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除退款申请' })
  @ApiParam({ name: 'id', description: '退款申请ID' })
  async remove(@Param('id') id: number) {
    return await this.refundApplyService.remove(id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除退款申请' })
  async batchRemove(@Body() batchDeleteRefundApplyDto: BatchDeleteRefundApplyDto) {
    return await this.refundApplyService.batchRemove(batchDeleteRefundApplyDto.ids);
  }

  @Get('stats/status')
  @ApiOperation({ summary: '获取退款申请状态统计' })
  async getRefundStats() {
    return await this.refundApplyService.getRefundStats();
  }

  @Get('status/list')
  @ApiOperation({ summary: '获取退款申请状态列表' })
  async getStatusList() {
    return REFUND_APPLY_STATUS;
  }

  @Get('list')
  @ApiOperation({ summary: '获取退款申请列表（兼容旧接口）' })
  async list(@Query() queryDto: RefundApplyQueryDto) {
    const result = await this.refundApplyService.findAll(queryDto);
    return {
      code: 200,
      message: '获取成功',
      data: {
        records: result.items,
        total: result.total,
        page: result.page,
        size: result.size,
        total_pages: result.total_pages,
      },
    };
  }

  @Get('detail')
  @ApiOperation({ summary: '获取退款申请详情（兼容旧接口）' })
  async detail(@Query('id') id: number) {
    const item = await this.refundApplyService.findOne(id);
    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @Get('config')
  @ApiOperation({ summary: '获取退款状态配置（兼容旧接口）' })
  async config() {
    return {
      code: 200,
      message: '获取成功',
      data: REFUND_APPLY_STATUS,
    };
  }
}