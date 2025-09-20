import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
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

@Injectable()
export class UserHistoryService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 获取用户浏览历史列表 - 对齐PHP版本 user/user/historyProduct
   */
  async getHistoryList(userId: number, historyListDto: HistoryListDto): Promise<HistoryListResponse> {
    const {
      page = 1,
      size = 20,
      sort_field = 'view_time',
      sort_order = 'desc',
      keyword,
    } = historyListDto;

    const skip = (page - 1) * size;

    // 首先获取用户的浏览历史ID列表
    const userInfo = await this.databaseService.user.findUnique({
      where: { user_id: userId },
      select: { history_product_ids: true },
    });

    const historyIds: number[] = (() => {
      const raw = userInfo?.history_product_ids;
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((n: any) => Number(n)).filter((n: any) => !isNaN(n)) : [];
      } catch {
        return [];
      }
    })();

    if (historyIds.length === 0) {
      return {
        records: [],
        total: 0,
        page,
        size,
        totalPages: 0,
      };
    }

    // 构建商品查询条件
    const productWhere: any = {
      product_id: { in: historyIds },
    };

    if (keyword) {
      productWhere.product_name = {
        contains: keyword,
      };
    }

    const [products, total] = await Promise.all([
      this.databaseService.product.findMany({
        where: productWhere,
        skip,
        take: size,
        orderBy: [
          // 按照历史记录中的顺序排序
          { product_id: 'desc' }, // 临时排序，需要在应用层重新排序
        ],
        select: {
          product_id: true,
          product_name: true,
          pic_url: true,
          product_price: true,
          market_price: true,
          product_status: true,
          product_stock: true,
          virtual_sales: true,
        },
      }),
      this.databaseService.product.count({
        where: productWhere,
      }),
    ]);

    // 根据历史记录ID列表重新排序
    const orderedProducts = products.sort((a, b) => {
      const aIndex = historyIds.indexOf(a.product_id);
      const bIndex = historyIds.indexOf(b.product_id);
      return bIndex - aIndex; // 降序排列，最新的在前面
    });

    // 格式化商品信息
    const formattedProducts = orderedProducts.map((product, index) => ({
      id: product.product_id,
      product_id: product.product_id,
      product_name: product.product_name,
      product_image: product.pic_url,
      product_price: Number(product.product_price),
      market_price: Number(product.market_price),
      is_on_sale: product.product_status === 1,
      stock: product.product_stock,
      sales_count: product.virtual_sales,
      view_time: new Date().toISOString(), // 需要从实际历史记录中获取
      view_duration: 0, // 需要从实际历史记录中获取
      view_count: index + 1, // 浏览顺序
    }));

    return {
      records: formattedProducts,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 添加浏览历史
   */
  async addHistory(userId: number, addHistoryDto: AddHistoryDto): Promise<SuccessResponse> {
    const { product_id, view_duration = 0, source_page } = addHistoryDto;

    // 检查商品是否存在
    const product = await this.databaseService.product.findUnique({
      where: { productId: product_id },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    // 获取用户当前的历史记录
    const userInfo = await this.databaseService.user.findUnique({
      where: { user_id: userId },
      select: { history_product_ids: true },
    });

    let historyProductIds = userInfo?.historyProductIds || [];

    // 如果商品已经在历史记录中，先移除旧的记录
    const existingIndex = historyProductIds.indexOf(product_id);
    if (existingIndex !== -1) {
      historyProductIds.splice(existingIndex, 1);
    }

    // 将商品ID添加到历史记录的最前面
    historyProductIds.unshift(product_id);

    // 限制历史记录数量，比如只保留最近100个
    if (historyProductIds.length > 100) {
      historyProductIds = historyProductIds.slice(0, 100);
    }

    // 更新用户的历史记录
    await this.databaseService.user.update({
      where: { userId },
      data: { historyProductIds },
    });

    // TODO: 这里可以同时记录到专门的浏览历史表中，包含详细的信息如浏览时长、来源等
    // 目前为了与PHP版本保持一致，只更新用户表中的historyProductIds字段

    return {
      message: '浏览历史添加成功',
      history_id: Date.now(), // 临时ID，实际应该从数据库获取
    };
  }

  /**
   * 删除浏览历史 - 对齐PHP版本 user/user/delHistoryProduct
   */
  async deleteHistory(userId: number, deleteHistoryDto: DeleteHistoryDto): Promise<SuccessResponse> {
    const { ids } = deleteHistoryDto;

    // 获取用户当前的历史记录
    const userInfo = await this.databaseService.user.findUnique({
      where: { userId },
      select: { historyProductIds: true },
    });

    if (!userInfo || !userInfo.historyProductIds || userInfo.historyProductIds.length === 0) {
      throw new NotFoundException('浏览历史不存在');
    }

    // 从历史记录中移除指定的商品ID
    const updatedHistoryIds = userInfo.historyProductIds.filter(
      productId => !ids.includes(productId)
    );

    // 更新用户的历史记录
    await this.databaseService.user.update({
      where: { userId },
      data: { historyProductIds: updatedHistoryIds },
    });

    return {
      message: '浏览历史删除成功',
    };
  }

  /**
   * 清除浏览历史
   */
  async clearHistory(userId: number, clearHistoryDto: ClearHistoryDto): Promise<SuccessResponse> {
    const { clear_type = 'all', days = 30 } = clearHistoryDto;

    if (clear_type === 'all') {
      // 清除所有浏览历史
      await this.databaseService.user.update({
        where: { userId },
        data: { historyProductIds: [] },
      });
    } else {
      // 清除指定天数前的历史记录（这里简化处理，保留最新的部分记录）
      const userInfo = await this.databaseService.user.findUnique({
        where: { userId },
        select: { historyProductIds: true },
      });

      if (userInfo && userInfo.historyProductIds) {
        // 保留最近的50个记录
        const keepCount = Math.max(50, userInfo.historyProductIds.length - days);
        const updatedHistoryIds = userInfo.historyProductIds.slice(0, keepCount);

        await this.databaseService.user.update({
          where: { userId },
          data: { historyProductIds: updatedHistoryIds },
        });
      }
    }

    return {
      message: '浏览历史清除成功',
    };
  }

  /**
   * 获取浏览历史详情
   */
  async getHistoryDetail(userId: number, historyDetailDto: HistoryDetailDto): Promise<HistoryResponse> {
    const { id } = historyDetailDto;

    // 获取用户的历史记录
    const userInfo = await this.databaseService.user.findUnique({
      where: { userId },
      select: { historyProductIds: true },
    });

    if (!userInfo || !userInfo.historyProductIds || !userInfo.historyProductIds.includes(id)) {
      throw new NotFoundException('浏览历史不存在');
    }

    // 获取商品详情
    const product = await this.databaseService.product.findUnique({
      where: { productId: id },
      select: {
        productId: true,
        productName: true,
        productImage: true,
        productPrice: true,
        marketPrice: true,
        isOnSale: true,
        stock: true,
        salesCount: true,
        productDesc: true,
        shopId: true,
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    const historyDetail = {
      id: product.productId,
      product_id: product.productId,
      product_name: product.productName,
      product_image: product.productImage,
      product_price: Number(product.productPrice),
      market_price: Number(product.marketPrice),
      is_on_sale: product.isOnSale,
      stock: product.stock,
      sales_count: product.salesCount,
      product_desc: product.productDesc,
      shop_id: product.shopId,
      view_time: new Date().toISOString(), // 需要从实际历史记录中获取
      view_duration: 0, // 需要从实际历史记录中获取
      source_page: '', // 需要从实际历史记录中获取
    };

    return {
      history: historyDetail,
    };
  }

  /**
   * 获取浏览历史统计
   */
  async getHistoryStats(userId: number, historyStatsDto: HistoryStatsDto): Promise<HistoryStatsResponse> {
    const { days = 30 } = historyStatsDto;

    // 获取用户的历史记录
    const userInfo = await this.databaseService.user.findUnique({
      where: { userId },
      select: { historyProductIds: true },
    });

    const historyProductIds: number[] = (() => {
      const raw = userInfo?.history_product_ids;
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((n: any) => Number(n)).filter((n: any) => !isNaN(n)) : [];
      } catch {
        return [];
      }
    })();

    // 计算基础统计
    const totalViews = historyProductIds.length;
    const productCount = new Set(historyProductIds).size;
    const avgDuration = 0; // 需要从实际历史记录中计算

    // 生成每日统计（示例数据）
    const dailyStats = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      dailyStats.push({
        date: dateStr,
        views: Math.floor(Math.random() * 10), // 模拟数据
        unique_products: Math.floor(Math.random() * 5), // 模拟数据
      });
    }

    return {
      total_views: totalViews,
      product_count: productCount,
      avg_duration: avgDuration,
      last_view_time: historyProductIds.length > 0 ? new Date().toISOString() : null,
      daily_stats: dailyStats,
    };
  }

  /**
   * 获取推荐商品（基于浏览历史）
   */
  async getRecommendedProducts(userId: number, limit: number = 10): Promise<any[]> {
    // 获取用户的历史记录
    const userInfo = await this.databaseService.user.findUnique({
      where: { userId },
      select: { historyProductIds: true },
    });

    const historyProductIds = userInfo?.historyProductIds || [];

    if (historyProductIds.length === 0) {
      // 如果没有浏览历史，返回热门商品
      return this.databaseService.product.findMany({
        where: { product_status: 1 },
        orderBy: { virtual_sales: 'desc' },
        take: limit,
        select: {
          product_id: true,
          product_name: true,
          pic_url: true,
          product_price: true,
          market_price: true,
        },
      });
    }

    // 基于浏览历史获取相关商品
    // 这里可以基于商品分类、标签等进行推荐
    // 简化实现：获取用户浏览过的商品的同类商品
    const viewedProducts = await this.databaseService.product.findMany({
      where: { product_id: { in: historyProductIds.slice(0, 5) } }, // 取最近浏览的5个商品
      select: { category_id: true },
    });

    const categoryIds = [...new Set(viewedProducts.map(p => p.category_id).filter(Boolean))];

    if (categoryIds.length === 0) {
      // 如果没有分类信息，返回热门商品
      return this.databaseService.product.findMany({
        where: {
          product_status: 1,
          product_id: { notIn: historyProductIds }, // 排除已浏览过的商品
        },
        orderBy: { virtual_sales: 'desc' },
        take: limit,
        select: {
          product_id: true,
          product_name: true,
          pic_url: true,
          product_price: true,
          market_price: true,
        },
      });
    }

    // 获取同类商品
    const recommendedProducts = await this.databaseService.product.findMany({
      where: {
        category_id: { in: categoryIds },
        product_status: 1,
        product_id: { notIn: historyProductIds }, // 排除已浏览过的商品
      },
      orderBy: { virtual_sales: 'desc' },
      take: limit,
      select: {
        product_id: true,
        product_name: true,
        pic_url: true,
        product_price: true,
        market_price: true,
      },
    });

    return recommendedProducts;
  }

  /**
   * 批量添加浏览历史
   */
  async batchAddHistory(userId: number, products: AddHistoryDto[]): Promise<SuccessResponse> {
    // 获取用户当前的历史记录
    const userInfo = await this.databaseService.user.findUnique({
      where: { user_id: userId },
      select: { history_product_ids: true },
    });

    let historyProductIds: number[] = (() => {
      const raw = userInfo?.history_product_ids;
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((n: any) => Number(n)).filter((n: any) => !isNaN(n)) : [];
      } catch {
        return [];
      }
    })();

    // 处理每个商品
    products.forEach(({ product_id }) => {
      // 如果商品已经在历史记录中，先移除旧的记录
      const existingIndex = historyProductIds.indexOf(product_id);
      if (existingIndex !== -1) {
        historyProductIds.splice(existingIndex, 1);
      }
      // 将商品ID添加到历史记录的最前面
      historyProductIds.unshift(product_id);
    });

    // 去重
    historyProductIds = [...new Set(historyProductIds)];

    // 限制历史记录数量
    if (historyProductIds.length > 100) {
      historyProductIds = historyProductIds.slice(0, 100);
    }

    // 更新用户的历史记录
    await this.databaseService.user.update({
      where: { user_id: userId },
      data: { history_product_ids: JSON.stringify(historyProductIds) },
    });

    return {
      message: '批量添加浏览历史成功',
    };
  }
}
