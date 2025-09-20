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
import { UserHistoryService } from './history.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  HistoryListDto,
  AddHistoryDto,
  DeleteHistoryDto,
  ClearHistoryDto,
  HistoryDetailDto,
  HistoryStatsDto,
  HistoryListResponse,
  HistoryResponse,
  HistoryStatsResponse,
  SuccessResponse,
} from './dto/history.dto';

@ApiTags('User History Management')
@Controller('api/user/history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserHistoryController {
  constructor(private readonly userHistoryService: UserHistoryService) {}

  /**
   * 获取浏览历史列表 - 对齐PHP版本 user/user/historyProduct
   */
  @Get('list')
  @ApiOperation({ summary: '获取浏览历史列表' })
  async getHistoryList(@Request() req, @Query() historyListDto: HistoryListDto): Promise<HistoryListResponse> {
    return this.userHistoryService.getHistoryList(req.user.userId, historyListDto);
  }

  /**
   * 获取最近浏览商品 - 对齐PHP版本 user/user/historyProduct
   */
  @Get('products')
  @ApiOperation({ summary: '获取最近浏览商品' })
  async getRecentProducts(@Request() req, @Query() query: any): Promise<HistoryListResponse> {
    const historyListDto = {
      page: parseInt(query.page) || 1,
      size: parseInt(query.size) || 20,
      sort_field: query.sort_field || 'view_time',
      sort_order: query.sort_order || 'desc',
      keyword: query.keyword || '',
    };
    return this.userHistoryService.getHistoryList(req.user.userId, historyListDto);
  }

  /**
   * 添加浏览历史
   */
  @Post('add')
  @ApiOperation({ summary: '添加浏览历史' })
  async addHistory(@Request() req, @Body() addHistoryDto: AddHistoryDto): Promise<SuccessResponse> {
    return this.userHistoryService.addHistory(req.user.userId, addHistoryDto);
  }

  /**
   * 删除浏览历史 - 对齐PHP版本 user/user/delHistoryProduct
   */
  @Post('del')
  @ApiOperation({ summary: '删除浏览历史' })
  async deleteHistory(@Request() req, @Body() deleteHistoryDto: DeleteHistoryDto): Promise<SuccessResponse> {
    return this.userHistoryService.deleteHistory(req.user.userId, deleteHistoryDto);
  }

  /**
   * 清除浏览历史
   */
  @Post('clear')
  @ApiOperation({ summary: '清除浏览历史' })
  async clearHistory(@Request() req, @Body() clearHistoryDto: ClearHistoryDto): Promise<SuccessResponse> {
    return this.userHistoryService.clearHistory(req.user.userId, clearHistoryDto);
  }

  /**
   * 获取浏览历史详情
   */
  @Get('detail')
  @ApiOperation({ summary: '获取浏览历史详情' })
  async getHistoryDetail(@Request() req, @Query() historyDetailDto: HistoryDetailDto): Promise<HistoryResponse> {
    return this.userHistoryService.getHistoryDetail(req.user.userId, historyDetailDto);
  }

  /**
   * 获取浏览历史统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取浏览历史统计' })
  async getHistoryStats(@Request() req, @Query() historyStatsDto: HistoryStatsDto): Promise<HistoryStatsResponse> {
    return this.userHistoryService.getHistoryStats(req.user.userId, historyStatsDto);
  }

  /**
   * 获取推荐商品（基于浏览历史）
   */
  @Get('recommended')
  @ApiOperation({ summary: '获取推荐商品' })
  async getRecommendedProducts(
    @Request() req,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    return this.userHistoryService.getRecommendedProducts(req.user.userId, limit ? Number(limit) : 10);
  }

  /**
   * 批量添加浏览历史
   */
  @Post('batchAdd')
  @ApiOperation({ summary: '批量添加浏览历史' })
  async batchAddHistory(@Request() req, @Body() products: AddHistoryDto[]): Promise<SuccessResponse> {
    return this.userHistoryService.batchAddHistory(req.user.userId, products);
  }

  /**
   * 获取浏览历史数量
   */
  @Get('count')
  @ApiOperation({ summary: '获取浏览历史数量' })
  async getHistoryCount(@Request() req): Promise<{ count: number }> {
    const userInfo = await this.userHistoryService['databaseService'].user.findUnique({
      where: { user_id: req.user.userId },
      select: { history_product_ids: true },
    });
    const count = (() => {
      const raw = userInfo?.history_product_ids;
      if (!raw) return 0;
      try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr.length : 0; } catch { return 0; }
    })();
    return { count };
  }

  /**
   * 获取最近浏览的商品ID列表
   */
  @Get('recentIds')
  @ApiOperation({ summary: '获取最近浏览的商品ID列表' })
  async getRecentProductIds(@Request() req, @Query('limit') limit?: number): Promise<{ product_ids: number[] }> {
    const userInfo = await this.userHistoryService['databaseService'].user.findUnique({
      where: { user_id: req.user.userId },
      select: { history_product_ids: true },
    });
    let productIds: number[] = (() => {
      const raw = userInfo?.history_product_ids; if (!raw) return [];
      try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return []; }
    })();
    const limitNum = limit ? Number(limit) : 20;

    if (productIds.length > limitNum) {
      productIds = productIds.slice(0, limitNum);
    }

    return { product_ids: productIds };
  }

  /**
   * 检查商品是否在浏览历史中
   */
  @Get('check')
  @ApiOperation({ summary: '检查商品是否在浏览历史中' })
  async checkProductInHistory(
    @Request() req,
    @Query('product_id') productId: number,
  ): Promise<{ in_history: boolean; view_count?: number }> {
    const userInfo = await this.userHistoryService['databaseService'].user.findUnique({
      where: { user_id: req.user.userId },
      select: { history_product_ids: true },
    });
    const historyProductIds: number[] = (() => {
      const raw = userInfo?.history_product_ids; if (!raw) return [];
      try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return []; }
    })();
    const inHistory = historyProductIds.includes(productId);
    const viewCount = inHistory ? historyProductIds.indexOf(productId) + 1 : undefined;

    return { in_history: inHistory, view_count: viewCount };
  }
}
