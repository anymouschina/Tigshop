import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateFavoriteDto,
  GetFavoritesDto,
  UpdateFavoriteDto,
  FavoriteBatchDto,
  CheckFavoriteDto,
  FavoriteType,
} from './dto/favorite.dto';

export interface FavoriteResponse {
  id: number;
  userId: number;
  targetId: number;
  type: FavoriteType;
  remark?: string;
  targetInfo?: {
    id: number;
    name: string;
    image?: string;
    price?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteStatsResponse {
  totalCount: number;
  productCount: number;
  shopCount: number;
  articleCount: number;
  recentFavorites: FavoriteResponse[];
}

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 添加收藏 - 对齐PHP版本 user/favorite/add
   */
  async addFavorite(userId: number, createFavoriteDto: CreateFavoriteDto): Promise<FavoriteResponse> {
    const { targetId, type, remark } = createFavoriteDto;

    // 检查目标是否存在
    await this.validateTargetExists(targetId, type);

    // 检查是否已收藏
    const existingFavorite = await this.prisma.favorite.findFirst({
      where: {
        userId,
        targetId,
        type,
      },
    });

    if (existingFavorite) {
      throw new BadRequestException('已收藏该项目');
    }

    // 创建收藏
    const favorite = await this.prisma.$queryRaw`
      INSERT INTO "Favorite" (userId, targetId, type, remark, "createdAt", "updatedAt")
      VALUES (${userId}, ${targetId}, ${type}, ${remark || null}, NOW(), NOW())
      RETURNING *
    ` as any[];

    return this.formatFavoriteResponse(favorite[0]);
  }

  /**
   * 获取收藏列表 - 对齐PHP版本 user/favorite/list
   */
  async getFavorites(userId: number, query: GetFavoritesDto) {
    const { type, page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const whereClause: any = { userId };
    if (type) whereClause.type = type;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
      }),
      this.prisma.favorite.count({
        where: whereClause,
      }),
    ]);

    // 为每个收藏项获取目标信息
    const favoritesWithInfo = await Promise.all(
      favorites.map(async (favorite) => {
        const targetInfo = await this.getTargetInfo(favorite.targetId, favorite.type);
        return this.formatFavoriteResponse(favorite, targetInfo);
      })
    );

    return {
      list: favoritesWithInfo,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取收藏详情 - 对齐PHP版本 user/favorite/detail
   */
  async getFavoriteDetail(userId: number, favoriteId: number): Promise<FavoriteResponse> {
    const favorite = await this.prisma.favorite.findFirst({
      where: {
        id: favoriteId,
        userId,
      },
    });

    if (!favorite) {
      throw new NotFoundException('收藏不存在或无权限');
    }

    const targetInfo = await this.getTargetInfo(favorite.targetId, favorite.type);
    return this.formatFavoriteResponse(favorite, targetInfo);
  }

  /**
   * 更新收藏 - 对齐PHP版本 user/favorite/update
   */
  async updateFavorite(userId: number, favoriteId: number, updateFavoriteDto: UpdateFavoriteDto): Promise<FavoriteResponse> {
    // 检查收藏是否存在且属于该用户
    const existingFavorite = await this.prisma.favorite.findFirst({
      where: {
        id: favoriteId,
        userId,
      },
    });

    if (!existingFavorite) {
      throw new NotFoundException('收藏不存在或无权限');
    }

    // 更新收藏
    const updatedFavorite = await this.prisma.favorite.update({
      where: { id: favoriteId },
      data: updateFavoriteDto,
    });

    const targetInfo = await this.getTargetInfo(updatedFavorite.targetId, updatedFavorite.type);
    return this.formatFavoriteResponse(updatedFavorite, targetInfo);
  }

  /**
   * 删除收藏 - 对齐PHP版本 user/favorite/delete
   */
  async deleteFavorite(userId: number, favoriteId: number) {
    // 检查收藏是否存在且属于该用户
    const favorite = await this.prisma.favorite.findFirst({
      where: {
        id: favoriteId,
        userId,
      },
    });

    if (!favorite) {
      throw new NotFoundException('收藏不存在或无权限');
    }

    // 删除收藏
    await this.prisma.favorite.delete({
      where: { id: favoriteId },
    });

    return { message: '收藏删除成功' };
  }

  /**
   * 批量删除收藏 - 对齐PHP版本 user/favorite/batchDelete
   */
  async batchDeleteFavorites(userId: number, batchDto: FavoriteBatchDto) {
    const { targetIds, type } = batchDto;

    const deletedCount = await this.prisma.favorite.deleteMany({
      where: {
        userId,
        targetId: { in: targetIds },
        type,
      },
    });

    return {
      message: '批量删除完成',
      deletedCount: deletedCount.count,
      targetIds,
    };
  }

  /**
   * 检查是否已收藏 - 对齐PHP版本 user/favorite/isFavorite
   */
  async checkFavorite(userId: number, checkDto: CheckFavoriteDto) {
    const { targetId, type } = checkDto;

    const favorite = await this.prisma.favorite.findFirst({
      where: {
        userId,
        targetId,
        type,
      },
    });

    return {
      isFavorite: !!favorite,
      targetId,
      type,
      favoriteId: favorite?.id,
    };
  }

  /**
   * 获取收藏统计 - 对齐PHP版本 user/favorite/stats
   */
  async getFavoriteStats(userId: number): Promise<FavoriteStatsResponse> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10, // 最近10个收藏
    });

    const totalCount = favorites.length;
    const productCount = favorites.filter(f => f.type === FavoriteType.PRODUCT).length;
    const shopCount = favorites.filter(f => f.type === FavoriteType.SHOP).length;
    const articleCount = favorites.filter(f => f.type === FavoriteType.ARTICLE).length;

    const recentFavorites = await Promise.all(
      favorites.slice(0, 5).map(async (favorite) => {
        const targetInfo = await this.getTargetInfo(favorite.targetId, favorite.type);
        return this.formatFavoriteResponse(favorite, targetInfo);
      })
    );

    return {
      totalCount,
      productCount,
      shopCount,
      articleCount,
      recentFavorites,
    };
  }

  /**
   * 切换收藏状态 - 对齐PHP版本 user/favorite/toggle
   */
  async toggleFavorite(userId: number, createFavoriteDto: CreateFavoriteDto) {
    const { targetId, type, remark } = createFavoriteDto;

    // 检查目标是否存在
    await this.validateTargetExists(targetId, type);

    // 查找现有收藏
    const existingFavorite = await this.prisma.favorite.findFirst({
      where: {
        userId,
        targetId,
        type,
      },
    });

    if (existingFavorite) {
      // 如果已存在，删除收藏
      await this.prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      return { message: '取消收藏成功', isFavorited: false };
    } else {
      // 如果不存在，添加收藏
      const favorite = await this.prisma.$queryRaw`
        INSERT INTO "Favorite" (userId, targetId, type, remark, "createdAt", "updatedAt")
        VALUES (${userId}, ${targetId}, ${type}, ${remark || null}, NOW(), NOW())
        RETURNING *
      ` as any[];
      return { message: '收藏成功', isFavorited: true, favorite: favorite[0] };
    }
  }

  /**
   * 获取商品收藏列表 - 对齐PHP版本 user/favorite/products
   */
  async getProductFavorites(userId: number, query: GetFavoritesDto) {
    return this.getFavorites(userId, { ...query, type: FavoriteType.PRODUCT });
  }

  /**
   * 获取店铺收藏列表 - 对齐PHP版本 user/favorite/shops
   */
  async getShopFavorites(userId: number, query: GetFavoritesDto) {
    return this.getFavorites(userId, { ...query, type: FavoriteType.SHOP });
  }

  /**
   * 获取文章收藏列表 - 对齐PHP版本 user/favorite/articles
   */
  async getArticleFavorites(userId: number, query: GetFavoritesDto) {
    return this.getFavorites(userId, { ...query, type: FavoriteType.ARTICLE });
  }

  /**
   * 验证目标是否存在
   */
  private async validateTargetExists(targetId: number, type: FavoriteType) {
    switch (type) {
      case FavoriteType.PRODUCT:
        const product = await this.prisma.product.findFirst({
          where: { id: targetId },
        });
        if (!product) {
          throw new NotFoundException('商品不存在');
        }
        break;
      case FavoriteType.SHOP:
        const shop = await this.prisma.shop.findFirst({
          where: { id: targetId },
        });
        if (!shop) {
          throw new NotFoundException('店铺不存在');
        }
        break;
      case FavoriteType.ARTICLE:
        const article = await this.prisma.article.findFirst({
          where: { id: targetId },
        });
        if (!article) {
          throw new NotFoundException('文章不存在');
        }
        break;
      default:
        throw new BadRequestException('无效的收藏类型');
    }
  }

  /**
   * 获取目标信息
   */
  private async getTargetInfo(targetId: number, type: FavoriteType) {
    switch (type) {
      case FavoriteType.PRODUCT:
        const product = await this.prisma.product.findFirst({
          where: { id: targetId },
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
          },
        });
        return product ? {
          id: product.id,
          name: product.name,
          image: product.image,
          price: Number(product.price),
        } : null;
      case FavoriteType.SHOP:
        const shop = await this.prisma.shop.findFirst({
          where: { id: targetId },
          select: {
            id: true,
            name: true,
            logo: true,
          },
        });
        return shop ? {
          id: shop.id,
          name: shop.name,
          image: shop.logo,
        } : null;
      case FavoriteType.ARTICLE:
        const article = await this.prisma.article.findFirst({
          where: { id: targetId },
          select: {
            id: true,
            title: true,
            image: true,
          },
        });
        return article ? {
          id: article.id,
          name: article.title,
          image: article.image,
        } : null;
      default:
        return null;
    }
  }

  /**
   * 格式化收藏响应
   */
  private formatFavoriteResponse(favorite: any, targetInfo?: any): FavoriteResponse {
    return {
      id: favorite.id,
      userId: favorite.userId,
      targetId: favorite.targetId,
      type: favorite.type,
      remark: favorite.remark,
      targetInfo,
      createdAt: favorite.createdAt,
      updatedAt: favorite.updatedAt,
    };
  }
}