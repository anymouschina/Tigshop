// @ts-nocheck
import { Controller, Get, Post, Body, Query, Request, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserCollectService } from './user-collect.service';
import {
  CollectQueryDto,
  CollectProductDto,
  CancelCollectDto,
} from './dto/user-collect.dto';

@ApiTags('用户端商品收藏')
@Controller('api/user/collectProduct')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserCollectController {
  constructor(private readonly userCollectService: UserCollectService) {}

  @Get('list')
  @ApiOperation({ summary: '获取商品收藏列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'category_id', required: false, description: '分类ID' })
  @ApiQuery({ name: 'sort_field', required: false, description: '排序字段' })
  @ApiQuery({ name: 'sort_order', required: false, description: '排序方式' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async list(@Request() req, @Query() query: CollectQueryDto) {
    const userId = req.user.userId;
    return this.userCollectService.getCollectList(userId, query);
  }

  @Post('save')
  @ApiOperation({ summary: '收藏商品' })
  @ApiResponse({ status: 200, description: '收藏成功' })
  async save(@Request() req, @Body() body: CollectProductDto) {
    const userId = req.user.userId;
    return this.userCollectService.saveCollect(userId, body);
  }

  @Post('cancel')
  @ApiOperation({ summary: '取消收藏' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async cancel(@Request() req, @Body() body: CancelCollectDto) {
    const userId = req.user.userId;
    return this.userCollectService.cancelCollect(userId, body);
  }

  @Get('isCollected')
  @ApiOperation({ summary: '检查商品是否已收藏' })
  @ApiQuery({ name: 'product_id', required: true, description: '商品ID' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async isCollected(@Request() req, @Query() query: { product_id: number }) {
    const userId = req.user.userId;
    const productId = query.product_id;
    return this.userCollectService.isCollected(userId, productId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取收藏统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async statistics(@Request() req) {
    const userId = req.user.userId;
    return this.userCollectService.getCollectStatistics(userId);
  }

  @Get('batchCheck')
  @ApiOperation({ summary: '批量检查商品收藏状态' })
  @ApiQuery({ name: 'product_ids', required: true, description: '商品ID列表，用逗号分隔' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async batchCheck(@Request() req, @Query() query: { product_ids: string }) {
    const userId = req.user.userId;
    const productIds = query.product_ids.split(',').map(id => parseInt(id));
    return this.userCollectService.batchCheckCollect(userId, productIds);
  }

  @Post('batchSave')
  @ApiOperation({ summary: '批量收藏商品' })
  @ApiResponse({ status: 200, description: '收藏成功' })
  async batchSave(@Request() req, @Body() body: { product_ids: number[] }) {
    const userId = req.user.userId;
    return this.userCollectService.batchSaveCollect(userId, body.product_ids);
  }

  @Post('batchCancel')
  @ApiOperation({ summary: '批量取消收藏' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async batchCancel(@Request() req, @Body() body: { product_ids: number[] }) {
    const userId = req.user.userId;
    return this.userCollectService.batchCancelCollect(userId, body.product_ids);
  }

  @Get('recommend')
  @ApiOperation({ summary: '获取推荐收藏商品' })
  @ApiQuery({ name: 'limit', required: false, description: '数量限制' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async recommend(@Request() req, @Query() query: { limit?: number }) {
    const userId = req.user.userId;
    const limit = query.limit || 10;
    return this.userCollectService.getRecommendCollect(userId, limit);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取收藏分类统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async categories(@Request() req) {
    const userId = req.user.userId;
    return this.userCollectService.getCollectCategories(userId);
  }

  @Get('recent')
  @ApiOperation({ summary: '获取最近收藏' })
  @ApiQuery({ name: 'limit', required: false, description: '数量限制' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async recent(@Request() req, @Query() query: { limit?: number }) {
    const userId = req.user.userId;
    const limit = query.limit || 5;
    return this.userCollectService.getRecentCollect(userId, limit);
  }
}
