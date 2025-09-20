// @ts-nocheck
import { Controller, Get, Post, Body, Param, Delete, Query, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StatementService } from './statement.service';
import {
  StatementQueryDto,
  StatementDetailDto,
  CreateStatementDto,
  UpdateStatementDto,
  DeleteStatementDto,
  BatchDeleteStatementDto,
  STATEMENT_TYPE,
  STATEMENT_STATUS
} from './statement.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('财务管理-账单记录')
@Controller('admin/finance/statement')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class StatementController {
  constructor(private readonly statementService: StatementService) {}

  @Get()
  @ApiOperation({ summary: '获取账单记录列表' })
  @ApiQuery({ name: 'keyword', description: '关键词搜索', required: false })
  @ApiQuery({ name: 'user_id', description: '用户ID', required: false })
  @ApiQuery({ name: 'shop_id', description: '店铺ID', required: false })
  @ApiQuery({ name: 'type', description: '类型', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'start_date', description: '开始日期', required: false })
  @ApiQuery({ name: 'end_date', description: '结束日期', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  async findAll(@Query() query: StatementQueryDto) {
    return await this.statementService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取账单记录详情' })
  @ApiParam({ name: 'id', description: '账单记录ID' })
  async findOne(@Param('id') id: number) {
    return await this.statementService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建账单记录' })
  async create(@Body() createStatementDto: CreateStatementDto) {
    return await this.statementService.create(createStatementDto);
  }

  @Put()
  @ApiOperation({ summary: '更新账单记录' })
  async update(@Body() updateStatementDto: UpdateStatementDto) {
    return await this.statementService.update(updateStatementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除账单记录' })
  @ApiParam({ name: 'id', description: '账单记录ID' })
  async remove(@Param('id') id: number) {
    return await this.statementService.remove(id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除账单记录' })
  async batchRemove(@Body() batchDeleteStatementDto: BatchDeleteStatementDto) {
    return await this.statementService.batchRemove(batchDeleteStatementDto.ids);
  }

  @Get('stats/status')
  @ApiOperation({ summary: '获取账单记录状态统计' })
  async getStatementStats() {
    return await this.statementService.getStatementStats();
  }

  @Get('stats/amount')
  @ApiOperation({ summary: '获取账单金额统计' })
  @ApiQuery({ name: 'start_date', description: '开始日期', required: false })
  @ApiQuery({ name: 'end_date', description: '结束日期', required: false })
  async getAmountStats(@Query('start_date') startDate?: string, @Query('end_date') endDate?: string) {
    let dateRange: [Date, Date] | undefined;
    if (startDate && endDate) {
      dateRange = [new Date(startDate), new Date(endDate)];
    }
    return await this.statementService.getAmountStats(dateRange);
  }

  @Get('type/list')
  @ApiOperation({ summary: '获取账单类型列表' })
  async getTypeList() {
    return STATEMENT_TYPE;
  }

  @Get('status/list')
  @ApiOperation({ summary: '获取账单状态列表' })
  async getStatusList() {
    return STATEMENT_STATUS;
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户账单记录' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'type', description: '类型', required: false })
  async getStatementByUser(
    @Param('userId') userId: number,
    @Query('type') type?: number,
  ) {
    return await this.statementService.getStatementByUser(userId, type);
  }

  @Get('shop/:shopId')
  @ApiOperation({ summary: '获取店铺账单记录' })
  @ApiParam({ name: 'shopId', description: '店铺ID' })
  @ApiQuery({ name: 'type', description: '类型', required: false })
  async getStatementByShop(
    @Param('shopId') shopId: number,
    @Query('type') type?: number,
  ) {
    return await this.statementService.getStatementByShop(shopId, type);
  }
}
