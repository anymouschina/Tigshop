import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('商品管理')
@Controller('api/products')
@ApiBearerAuth()
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  /**
   * 创建商品
   */
  @Post()
  @ApiOperation({ summary: '创建商品' })
  @ApiResponse({ status: 201, description: '商品创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'merchant')
  async create(@Body() createProductDto: CreateProductDto, @Request() req) {
    return this.productService.create(createProductDto, req.user?.userId);
  }

  /**
   * 获取商品列表
   */
  @Get()
  @ApiOperation({ summary: '获取商品列表' })
  @ApiResponse({ status: 200, description: '获取商品列表成功' })
  @Public()
  async findAll(@Query() queryDto: ProductQueryDto) {
    return this.productService.findAll(queryDto);
  }

  /**
   * 获取商品详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取商品详情' })
  @ApiResponse({ status: 200, description: '获取商品详情成功' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  /**
   * 更新商品
   */
  @Put(':id')
  @ApiOperation({ summary: '更新商品' })
  @ApiResponse({ status: 200, description: '商品更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'merchant')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  /**
   * 删除商品（软删除）
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除商品' })
  @ApiResponse({ status: 200, description: '商品删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'merchant')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  /**
   * 恢复商品
   */
  @Post(':id/restore')
  @ApiOperation({ summary: '恢复商品' })
  @ApiResponse({ status: 200, description: '商品恢复成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.productService.restore(id);
  }

  /**
   * 获取商品库存信息
   */
  @Get(':id/stock')
  @ApiOperation({ summary: '获取商品库存信息' })
  @ApiResponse({ status: 200, description: '获取商品库存成功' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  @Public()
  async getStock(
    @Param('id', ParseIntPipe) id: number,
    @Query('specId', new ParseIntPipe({ optional: true })) specId?: number,
  ) {
    return this.productService.getStock(id, specId);
  }

  /**
   * 更新商品库存
   */
  @Put(':id/stock')
  @ApiOperation({ summary: '更新商品库存' })
  @ApiResponse({ status: 200, description: '商品库存更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'merchant')
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity: number; specId?: number },
  ) {
    return this.productService.updateStock(id, body.quantity, body.specId);
  }

  /**
   * 获取热门商品
   */
  @Get('hot/list')
  @ApiOperation({ summary: '获取热门商品' })
  @ApiResponse({ status: 200, description: '获取热门商品成功' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @Public()
  async getHotProducts(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.productService.getHotProducts(limit || 10);
  }

  /**
   * 获取推荐商品
   */
  @Get('recommended/list')
  @ApiOperation({ summary: '获取推荐商品' })
  @ApiResponse({ status: 200, description: '获取推荐商品成功' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @Public()
  async getRecommendedProducts(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.productService.getRecommendedProducts(limit || 10);
  }

  /**
   * 获取新品商品
   */
  @Get('new/list')
  @ApiOperation({ summary: '获取新品商品' })
  @ApiResponse({ status: 200, description: '获取新品商品成功' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @Public()
  async getNewProducts(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.productService.getNewProducts(limit || 10);
  }

  /**
   * 搜索商品
   */
  @Get('search')
  @ApiOperation({ summary: '搜索商品' })
  @ApiResponse({ status: 200, description: '搜索商品成功' })
  @ApiQuery({ name: 'keyword', required: true, description: '搜索关键词' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @Public()
  async search(
    @Query('keyword') keyword: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    if (!keyword || keyword.trim() === '') {
      throw new BadRequestException('搜索关键词不能为空');
    }
    return this.productService.search(keyword.trim(), limit || 20);
  }
}

/**
 * 前端商品控制器 - 提供简化的API路径
 */
@ApiTags('商品')
@Controller('product')
export class FrontProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * 获取商品列表
   */
  @Get('list')
  @ApiOperation({ summary: '获取商品列表' })
  @Public()
  async getList(@Query() queryDto: ProductQueryDto) {
    return this.productService.findAll(queryDto);
  }

  /**
   * 获取商品详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取商品详情' })
  @Public()
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  /**
   * 获取热门商品
   */
  @Get('hot')
  @ApiOperation({ summary: '获取热门商品' })
  @Public()
  async getHot(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.productService.getHotProducts(limit || 10);
  }

  /**
   * 获取推荐商品
   */
  @Get('recommended')
  @ApiOperation({ summary: '获取推荐商品' })
  @Public()
  async getRecommended(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.productService.getRecommendedProducts(limit || 10);
  }

  /**
   * 获取新品商品
   */
  @Get('new')
  @ApiOperation({ summary: '获取新品商品' })
  @Public()
  async getNew(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.productService.getNewProducts(limit || 10);
  }

  /**
   * 搜索商品
   */
  @Get('search')
  @ApiOperation({ summary: '搜索商品' })
  @Public()
  async search(
    @Query('keyword') keyword: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    if (!keyword || keyword.trim() === '') {
      throw new BadRequestException('搜索关键词不能为空');
    }
    return this.productService.search(keyword.trim(), limit || 20);
  }
}
