import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ProductItem {
  product_id: number;
}

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProductIds(page: number = 1, size: number = 10, userId?: number) {
    this.logger.debug(`Getting recommended product IDs, page: ${page}, size: ${size}, userId: ${userId}`);

    try {
      let resultProductList: ProductItem[] = [];

      // 获取热门商品 (intro_type = hot)
      const hotProductList = await this.getProductIdsByType({ introType: 'hot', size: 10 });
      resultProductList = [...resultProductList, ...hotProductList];

      // 获取精品商品 (intro_type = best)
      const bestProductList = await this.getProductIdsByType({ introType: 'best', size: 10 });
      resultProductList = [...resultProductList, ...bestProductList];

      // 如果用户已登录，获取用户历史浏览商品
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { user_id: userId },
          select: { history_product_ids: true }
        });

        if (user?.history_product_ids) {
          // 将逗号分隔的字符串转换为数字数组
          const historyIds = user.history_product_ids
            .split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id));

          if (historyIds.length > 0) {
            const historyProductList = await this.getProductIdsByType({
              productIds: historyIds,
              size: 20
            });
            if (historyProductList.length > 0) {
              resultProductList = [...historyProductList, ...resultProductList];
            }
          }
        }
      }

      // 根据product_id去重
      const uniqueProducts = new Map<number, ProductItem>();
      resultProductList.forEach(product => {
        uniqueProducts.set(product.product_id, product);
      });
      resultProductList = Array.from(uniqueProducts.values());

      // 如果总数不足40个，随机获取更多商品补充
      const existingIds = resultProductList.map(p => p.product_id);
      if (resultProductList.length < 40) {
        const additionalProducts = await this.getProductIdsByType({
          size: 40 - resultProductList.length,
          excludeIds: existingIds,
          sortOrder: 'rand'
        });
        resultProductList = [...resultProductList, ...additionalProducts];
      }

      // 取出所有product_id并打乱顺序
      const productIds = resultProductList.map(p => p.product_id);
      this.shuffleArray(productIds);

      // 返回逗号分隔的字符串（与PHP版本一致）
      const result = productIds.join(',');

      this.logger.debug(`Generated ${productIds.length} recommended product IDs: ${result}`);

      return result;
    } catch (error) {
      this.logger.error('Failed to get recommended product IDs', error.stack);
      throw error;
    }
  }

  private async getProductIdsByType(params: {
    introType?: string;
    size: number;
    productIds?: number[];
    excludeIds?: number[];
    sortOrder?: string;
  }): Promise<ProductItem[]> {
    const { introType, size, productIds, excludeIds, sortOrder } = params;

    const where: any = {
      product_status: 1,
      is_delete: 0
    };

    // 根据intro_type筛选
    if (introType === 'hot') {
      where.is_hot = 1;
    } else if (introType === 'best') {
      where.is_best = 1;
    } else if (introType === 'new') {
      where.is_new = 1;
    }

    // 根据指定商品ID筛选
    if (productIds && productIds.length > 0) {
      where.product_id = { in: productIds };
    }

    // 排除指定商品ID
    if (excludeIds && excludeIds.length > 0) {
      where.product_id = { notIn: excludeIds };
    }

    // 构建排序
    let orderBy: any[] = [];
    if (sortOrder === 'rand') {
      // MySQL随机排序，Prisma不支持原生RAND()，使用随机偏移
      const count = await this.prisma.product.count({ where });
      const skip = count > 0 ? Math.floor(Math.random() * count) : 0;
      const products = await this.prisma.product.findMany({
        where,
        select: { product_id: true },
        skip,
        take: size
      });
      return products;
    } else {
      orderBy = [
        { sort_order: 'asc' },
        { product_id: 'desc' }
      ];
    }

    return this.prisma.product.findMany({
      where,
      select: { product_id: true },
      orderBy,
      take: size
    });
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}