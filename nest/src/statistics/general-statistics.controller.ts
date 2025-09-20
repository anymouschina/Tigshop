// @ts-nocheck
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GeneralStatisticsService } from './general-statistics.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('综合统计')
@Controller('admin/statistics/general')
@UseGuards(RolesGuard)
@Roles('admin')
export class GeneralStatisticsController {
  constructor(private readonly generalStatisticsService: GeneralStatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取统计仪表板数据' })
  @ApiQuery({ name: 'period', required: false, description: '统计周期：today, week, month', enum: ['today', 'week', 'month'] })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDashboard(@Query('period') period: 'today' | 'week' | 'month' = 'today') {
    const shopId = 1; // TODO: 从token中获取
    const dashboard = await this.generalStatisticsService.getDashboard(shopId, period);

    return {
      code: 200,
      message: '获取成功',
      data: dashboard,
    };
  }

  @Get('financial')
  @ApiOperation({ summary: '获取财务统计' })
  @ApiQuery({ name: 'period', required: false, description: '统计周期：day, week, month, year' })
  @ApiQuery({ name: 'start_date', required: false, description: '开始日期' })
  @ApiQuery({ name: 'end_date', required: false, description: '结束日期' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFinancialStatistics(@Query() query: {
    period?: 'day' | 'week' | 'month' | 'year';
    start_date?: string;
    end_date?: string;
  }) {
    const shopId = 1; // TODO: 从token中获取
    const financial = await this.generalStatisticsService.getFinancialStatistics(shopId, query);

    return {
      code: 200,
      message: '获取成功',
      data: financial,
    };
  }

  @Get('inventory')
  @ApiOperation({ summary: '获取库存统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getInventoryStatistics() {
    const shopId = 1; // TODO: 从token中获取
    const inventory = await this.generalStatisticsService.getInventoryStatistics(shopId);

    return {
      code: 200,
      message: '获取成功',
      data: inventory,
    };
  }

  @Get('marketing')
  @ApiOperation({ summary: '获取营销统计' })
  @ApiQuery({ name: 'period', required: false, description: '统计周期：day, week, month' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMarketingStatistics(@Query() query: {
    period?: 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
  }) {
    const shopId = 1; // TODO: 从token中获取
    const marketing = await this.generalStatisticsService.getMarketingStatistics(shopId, query);

    return {
      code: 200,
      message: '获取成功',
      data: marketing,
    };
  }

  @Get('performance')
  @ApiOperation({ summary: '获取性能统计' })
  @ApiQuery({ name: 'period', required: false, description: '统计周期：hour, day' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPerformanceStatistics(@Query() query: {
    period?: 'hour' | 'day';
    start_date?: string;
    end_date?: string;
  }) {
    const performance = await this.generalStatisticsService.getPerformanceStatistics(query);

    return {
      code: 200,
      message: '获取成功',
      data: performance,
    };
  }

  @Get('comparison')
  @ApiOperation({ summary: '获取同期对比数据' })
  @ApiQuery({ name: 'type', required: true, description: '对比类型：sales, users, orders' })
  @ApiQuery({ name: 'period', required: false, description: '对比周期：day, week, month, year' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getComparisonData(@Query() query: {
    type: 'sales' | 'users' | 'orders';
    period?: 'day' | 'week' | 'month' | 'year';
    base_date?: string;
  }) {
    const shopId = 1; // TODO: 从token中获取
    const comparison = await this.generalStatisticsService.getComparisonData(shopId, query);

    return {
      code: 200,
      message: '获取成功',
      data: comparison,
    };
  }

  @Get('trends')
  @ApiOperation({ summary: '获取综合趋势分析' })
  @ApiQuery({ name: 'metrics', required: false, description: '指标列表，逗号分隔' })
  @ApiQuery({ name: 'period', required: false, description: '统计周期：day, week, month' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTrendsAnalysis(@Query() query: {
    metrics?: string;
    period?: 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
  }) {
    const shopId = 1; // TODO: 从token中获取
    const trends = await this.generalStatisticsService.getTrendsAnalysis(shopId, query);

    return {
      code: 200,
      message: '获取成功',
      data: trends,
    };
  }

  @Get('export-report')
  @ApiOperation({ summary: '导出综合统计报告' })
  @ApiQuery({ name: 'report_type', required: true, description: '报告类型：daily, weekly, monthly, yearly' })
  @ApiQuery({ name: 'format', required: false, description: '导出格式：pdf, excel', enum: ['pdf', 'excel'] })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportReport(@Query() query: {
    report_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    format?: 'pdf' | 'excel';
    date?: string;
  }) {
    const shopId = 1; // TODO: 从token中获取
    const result = await this.generalStatisticsService.exportReport(shopId, query);

    return {
      code: 200,
      message: '导出成功',
      data: result,
    };
  }

  @Get('real-time')
  @ApiOperation({ summary: '获取实时统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRealTimeStatistics() {
    const shopId = 1; // TODO: 从token中获取
    const realtime = await this.generalStatisticsService.getRealTimeStatistics(shopId);

    return {
      code: 200,
      message: '获取成功',
      data: realtime,
    };
  }
}
