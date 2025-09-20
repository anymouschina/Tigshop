// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollectService } from './collect.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CollectListDto,
  CreateCollectDto,
  UpdateCollectDto,
  DeleteCollectDto,
  BatchDeleteCollectDto,
  CollectProductDto,
  CheckCollectDto,
  CollectListResponse,
  CollectResponse,
  SuccessResponse,
  CheckCollectResponse,
  CollectType,
} from './dto/collect.dto';

@ApiTags('User Collection Management')
@Controller('api/user/collect')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  /**
   * 获取收藏列表 - 对齐PHP版本 user/collect/list
   */
  @Get('list')
  @ApiOperation({ summary: '获取收藏列表' })
  async getCollectList(@Request() req, @Query() collectListDto: CollectListDto): Promise<CollectListResponse> {
    return this.collectService.getCollectList(req.user.userId, collectListDto);
  }

  /**
   * 收藏商品 - 对齐PHP版本 user/collect/save
   */
  @Post('save')
  @ApiOperation({ summary: '收藏商品' })
  async collectProduct(@Request() req, @Body() collectProductDto: CollectProductDto): Promise<SuccessResponse> {
    return this.collectService.collectProduct(req.user.userId, collectProductDto);
  }

  /**
   * 取消收藏 - 对齐PHP版本 user/collect/cancel
   */
  @Post('cancel')
  @ApiOperation({ summary: '取消收藏' })
  async cancelCollect(@Request() req, @Body() deleteCollectDto: DeleteCollectDto): Promise<SuccessResponse> {
    return this.collectService.cancelCollect(req.user.userId, deleteCollectDto);
  }

  /**
   * 创建收藏
   */
  @Post('create')
  @ApiOperation({ summary: '创建收藏' })
  async createCollect(@Request() req, @Body() createCollectDto: CreateCollectDto): Promise<SuccessResponse> {
    return this.collectService.createCollect(req.user.userId, createCollectDto);
  }

  /**
   * 更新收藏
   */
  @Post('update')
  @ApiOperation({ summary: '更新收藏' })
  async updateCollect(@Request() req, @Body() updateCollectDto: UpdateCollectDto): Promise<SuccessResponse> {
    return this.collectService.updateCollect(req.user.userId, updateCollectDto);
  }

  /**
   * 批量删除收藏
   */
  @Post('batchDelete')
  @ApiOperation({ summary: '批量删除收藏' })
  async batchDeleteCollect(@Request() req, @Body() batchDeleteCollectDto: BatchDeleteCollectDto): Promise<SuccessResponse> {
    return this.collectService.batchDeleteCollect(req.user.userId, batchDeleteCollectDto);
  }

  /**
   * 检查是否已收藏
   */
  @Get('check')
  @ApiOperation({ summary: '检查是否已收藏' })
  async checkCollect(@Request() req, @Query() checkCollectDto: CheckCollectDto): Promise<CheckCollectResponse> {
    return this.collectService.checkCollect(req.user.userId, checkCollectDto);
  }

  /**
   * 获取收藏数量
   */
  @Get('count')
  @ApiOperation({ summary: '获取收藏数量' })
  async getCollectCount(@Request() req, @Query('collect_type') collect_type?: string): Promise<{ count: number }> {
    const count = await this.collectService.getCollectCount(req.user.userId, collect_type as any);
    return { count };
  }

  /**
   * 获取收藏详情
   */
  @Get('detail')
  @ApiOperation({ summary: '获取收藏详情' })
  async getCollectDetail(@Request() req, @Query('id') id: number): Promise<CollectResponse> {
    return this.collectService.getCollectDetail(req.user.userId, id);
  }

  /**
   * 获取商品收藏列表
   */
  @Get('products')
  @ApiOperation({ summary: '获取商品收藏列表' })
  async getProductCollects(@Request() req, @Query() collectListDto: CollectListDto): Promise<CollectListResponse> {
    const productCollectList: CollectListDto = {
      ...collectListDto,
      collect_type: CollectType.PRODUCT,
    };
    return this.collectService.getCollectList(req.user.userId, productCollectList);
  }

  /**
   * 获取店铺收藏列表
   */
  @Get('shops')
  @ApiOperation({ summary: '获取店铺收藏列表' })
  async getShopCollects(@Request() req, @Query() collectListDto: CollectListDto): Promise<CollectListResponse> {
    const shopCollectList: CollectListDto = {
      ...collectListDto,
      collect_type: CollectType.SHOP,
    };
    return this.collectService.getCollectList(req.user.userId, shopCollectList);
  }

  /**
   * 获取文章收藏列表
   */
  @Get('articles')
  @ApiOperation({ summary: '获取文章收藏列表' })
  async getArticleCollects(@Request() req, @Query() collectListDto: CollectListDto): Promise<CollectListResponse> {
    const articleCollectList: CollectListDto = {
      ...collectListDto,
      collect_type: CollectType.ARTICLE,
    };
    return this.collectService.getCollectList(req.user.userId, articleCollectList);
  }
}
