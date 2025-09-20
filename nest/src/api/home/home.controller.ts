import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HomeService } from './home.service';

@ApiTags('用户端首页')
@Controller('api/home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('index')
  @ApiOperation({ summary: '获取首页数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async index(@Request() req) {
    const userId = req.user?.userId || 0;
    return this.homeService.getHomeData(userId);
  }

  @Get('banner')
  @ApiOperation({ summary: '获取首页轮播图' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async banner() {
    return this.homeService.getBanners();
  }

  @Get('category')
  @ApiOperation({ summary: '获取首页分类' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async category() {
    return this.homeService.getHomeCategories();
  }

  @Get('hotProducts')
  @ApiOperation({ summary: '获取热门商品' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async hotProducts(@Query() query: { page?: number; size?: number }) {
    return this.homeService.getHotProducts(query);
  }

  @Get('newProducts')
  @ApiOperation({ summary: '获取新品上市' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async newProducts(@Query() query: { page?: number; size?: number }) {
    return this.homeService.getNewProducts(query);
  }

  @Get('recommendProducts')
  @ApiOperation({ summary: '获取推荐商品' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async recommendProducts(@Request() req, @Query() query: { page?: number; size?: number }) {
    const userId = req.user?.userId || 0;
    return this.homeService.getRecommendProducts(userId, query);
  }

  @Get('promotionActivities')
  @ApiOperation({ summary: '获取促销活动' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async promotionActivities() {
    return this.homeService.getPromotionActivities();
  }

  @Get('couponList')
  @ApiOperation({ summary: '获取优惠券列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async couponList(@Query() query: { page?: number; size?: number }) {
    return this.homeService.getAvailableCoupons(query);
  }

  @Get('seckillProducts')
  @ApiOperation({ summary: '获取秒杀商品' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async seckillProducts() {
    return this.homeService.getSeckillProducts();
  }

  @Get('grouponProducts')
  @ApiOperation({ summary: '获取团购商品' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async grouponProducts() {
    return this.homeService.getGrouponProducts();
  }

  @Get('userStatistics')
  @ApiOperation({ summary: '获取用户统计数据（登录用户）' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '获取成功' })
  async userStatistics(@Request() req) {
    const userId = req.user.userId;
    return this.homeService.getUserStatistics(userId);
  }

  @Get('shopRecommend')
  @ApiOperation({ summary: '获取推荐店铺' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async shopRecommend(@Query() query: { page?: number; size?: number }) {
    return this.homeService.getRecommendShops(query);
  }

  @Get('newsList')
  @ApiOperation({ summary: '获取资讯列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'category_id', required: false, description: '分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async newsList(@Query() query: { page?: number; size?: number; category_id?: number }) {
    return this.homeService.getNewsList(query);
  }
}