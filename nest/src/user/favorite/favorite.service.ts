// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateFavoriteDto,
  GetFavoritesDto,
  UpdateFavoriteDto,
  FavoriteBatchDto,
  CheckFavoriteDto,
  FavoriteType,
} from "./dto/favorite.dto";
import { PrismaService } from "src/prisma/prisma.service";

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 检查是否已收藏
   */
  private async checkIfFavoriteExists(
    userId: number,
    targetId: number,
    type: FavoriteType,
  ) {
    if (type === FavoriteType.PRODUCT) {
      return await this.prisma.collectProduct.findFirst({
        where: {
          userId,
          productId: targetId,
        },
      });
    } else if (type === FavoriteType.SHOP) {
      return await this.prisma.collectShop.findFirst({
        where: {
          userId,
          shopId: targetId,
        },
      });
    }
    return null;
  }

  /**
   * 添加收藏 - 对齐PHP版本 user/favorite/add
   */
  async addFavorite(
    userId: number,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteResponse> {
    const { targetId, type, remark } = createFavoriteDto;

    // 检查目标是否存在
    await this.validateTargetExists(targetId, type);

    // 检查是否已收藏
    const existingFavorite = await this.checkIfFavoriteExists(
      userId,
      targetId,
      type,
    );

    if (existingFavorite) {
      throw new BadRequestException("已收藏该项目");
    }

    // 根据类型创建不同的收藏
    let favorite;
    if (type === FavoriteType.PRODUCT) {
      favorite = await this.prisma.collectProduct.create({
        data: {
          userId,
          productId: targetId,
          addTime: new Date(),
        },
      });
    } else if (type === FavoriteType.SHOP) {
      favorite = await this.prisma.collectShop.create({
        data: {
          userId,
          shopId: targetId,
          addTime: new Date(),
        },
      });
    } else {
      // 对于文章收藏，暂时不实现，因为PHP schema中没有collect_article表
      throw new BadRequestException("暂不支持文章收藏");
    }

    return this.formatFavoriteResponse(favorite, type);
  }

  /**
   * 获取收藏列表 - 对齐PHP版本 user/favorite/list
   */
  async getFavorites(userId: number, query: GetFavoritesDto) {
    const { type, page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    let favorites: any[] = [];
    let total = 0;

    if (!type || type === FavoriteType.PRODUCT) {
      const [products, productCount] = await Promise.all([
        this.prisma.collectProduct.findMany({
          where: { userId },
          skip,
          take: size,
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
          orderBy: { addTime: "desc" },
        }),
        this.prisma.collectProduct.count({
          where: { userId },
        }),
      ]);
      favorites = favorites.concat(
        products.map((item) => ({
          ...item,
          targetId: item.productId,
          type: FavoriteType.PRODUCT,
          targetInfo: item.product,
        })),
      );
      total += productCount;
    }

    if (!type || type === FavoriteType.SHOP) {
      const [shops, shopCount] = await Promise.all([
        this.prisma.collectShop.findMany({
          where: { userId },
          skip,
          take: size,
          include: {
            shop: true,
          },
          orderBy: { addTime: "desc" },
        }),
        this.prisma.collectShop.count({
          where: { userId },
        }),
      ]);
      favorites = favorites.concat(
        shops.map((item) => ({
          ...item,
          targetId: item.shopId,
          type: FavoriteType.SHOP,
          targetInfo: item.shop,
        })),
      );
      total += shopCount;
    }

    // 分页处理
    const paginatedFavorites = favorites.slice(skip, skip + size);

    return {
      list: paginatedFavorites.map((fav) =>
        this.formatFavoriteResponse(fav, fav.type, fav.targetInfo),
      ),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取收藏详情 - 对齐PHP版本 user/favorite/detail
   */
  async getFavoriteDetail(
    userId: number,
    favoriteId: number,
    type: FavoriteType,
  ): Promise<FavoriteResponse> {
    let favorite;
    let targetInfo;

    if (type === FavoriteType.PRODUCT) {
      favorite = await this.prisma.collectProduct.findFirst({
        where: {
          collectId: favoriteId,
          userId,
        },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
      });
      if (favorite) {
        targetInfo = favorite.product;
      }
    } else if (type === FavoriteType.SHOP) {
      favorite = await this.prisma.collectShop.findFirst({
        where: {
          collectId: favoriteId,
          userId,
        },
        include: {
          shop: true,
        },
      });
      if (favorite) {
        targetInfo = favorite.shop;
      }
    }

    if (!favorite) {
      throw new NotFoundException("收藏不存在或无权限");
    }

    return this.formatFavoriteResponse(favorite, type, targetInfo);
  }

  /**
   * 更新收藏 - 对齐PHP版本 user/favorite/update
   */
  async updateFavorite(
    userId: number,
    favoriteId: number,
    updateFavoriteDto: UpdateFavoriteDto,
    type: FavoriteType,
  ): Promise<FavoriteResponse> {
    // 目前CollectProduct和CollectShop表没有remark字段，暂时不支持更新
    // 如果需要remark字段，需要在schema中添加
    throw new BadRequestException("收藏更新功能暂未实现");
  }

  /**
   * 删除收藏 - 对齐PHP版本 user/favorite/delete
   */
  async deleteFavorite(userId: number, favoriteId: number, type: FavoriteType) {
    let deleted = false;

    if (type === FavoriteType.PRODUCT) {
      const favorite = await this.prisma.collectProduct.findFirst({
        where: {
          collectId: favoriteId,
          userId,
        },
      });

      if (!favorite) {
        throw new NotFoundException("收藏不存在或无权限");
      }

      await this.prisma.collectProduct.delete({
        where: { collectId: favoriteId },
      });
      deleted = true;
    } else if (type === FavoriteType.SHOP) {
      const favorite = await this.prisma.collectShop.findFirst({
        where: {
          collectId: favoriteId,
          userId,
        },
      });

      if (!favorite) {
        throw new NotFoundException("收藏不存在或无权限");
      }

      await this.prisma.collectShop.delete({
        where: { collectId: favoriteId },
      });
      deleted = true;
    }

    if (!deleted) {
      throw new NotFoundException("收藏不存在或无权限");
    }

    return { message: "收藏删除成功" };
  }

  /**
   * 批量删除收藏 - 对齐PHP版本 user/favorite/batchDelete
   */
  async batchDeleteFavorites(userId: number, batchDto: FavoriteBatchDto) {
    const { targetIds, type } = batchDto;
    let deletedCount = 0;

    if (type === FavoriteType.PRODUCT) {
      const result = await this.prisma.collectProduct.deleteMany({
        where: {
          userId,
          productId: { in: targetIds },
        },
      });
      deletedCount = result.count;
    } else if (type === FavoriteType.SHOP) {
      const result = await this.prisma.collectShop.deleteMany({
        where: {
          userId,
          shopId: { in: targetIds },
        },
      });
      deletedCount = result.count;
    }

    return {
      message: "批量删除完成",
      deletedCount,
      targetIds,
    };
  }

  /**
   * 检查是否已收藏 - 对齐PHP版本 user/favorite/isFavorite
   */
  async checkFavorite(userId: number, checkDto: CheckFavoriteDto) {
    const { targetId, type } = checkDto;

    const existingFavorite = await this.checkIfFavoriteExists(
      userId,
      targetId,
      type,
    );

    return {
      isFavorite: !!existingFavorite,
      targetId,
      type,
      favoriteId: existingFavorite?.collectId,
    };
  }

  /**
   * 获取收藏统计 - 对齐PHP版本 user/favorite/stats
   */
  async getFavoriteStats(userId: number): Promise<FavoriteStatsResponse> {
    const [productCount, shopCount] = await Promise.all([
      this.prisma.collectProduct.count({ where: { userId } }),
      this.prisma.collectShop.count({ where: { userId } }),
    ]);

    const totalCount = productCount + shopCount;

    // 获取最近收藏（合并产品收藏和店铺收藏）
    const [recentProducts, recentShops] = await Promise.all([
      this.prisma.collectProduct.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
        orderBy: { addTime: "desc" },
        take: 5,
      }),
      this.prisma.collectShop.findMany({
        where: { userId },
        include: {
          shop: true,
        },
        orderBy: { addTime: "desc" },
        take: 5,
      }),
    ]);

    const recentFavorites = [
      ...recentProducts.map((item) => ({
        ...item,
        targetId: item.productId,
        type: FavoriteType.PRODUCT,
        targetInfo: item.product,
      })),
      ...recentShops.map((item) => ({
        ...item,
        targetId: item.shopId,
        type: FavoriteType.SHOP,
        targetInfo: item.shop,
      })),
    ]
      .sort((a, b) => b.addTime.getTime() - a.addTime.getTime())
      .slice(0, 5)
      .map((fav) => this.formatFavoriteResponse(fav, fav.type, fav.targetInfo));

    return {
      totalCount,
      productCount,
      shopCount,
      articleCount: 0, // 暂不支持文章收藏
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
    const existingFavorite = await this.checkIfFavoriteExists(
      userId,
      targetId,
      type,
    );

    if (existingFavorite) {
      // 如果已存在，删除收藏
      if (type === FavoriteType.PRODUCT) {
        await this.prisma.collectProduct.delete({
          where: { collectId: existingFavorite.collectId },
        });
      } else if (type === FavoriteType.SHOP) {
        await this.prisma.collectShop.delete({
          where: { collectId: existingFavorite.collectId },
        });
      }
      return { message: "取消收藏成功", isFavorited: false };
    } else {
      // 如果不存在，添加收藏
      let favorite;
      if (type === FavoriteType.PRODUCT) {
        favorite = await this.prisma.collectProduct.create({
          data: {
            userId,
            productId: targetId,
            addTime: new Date(),
          },
        });
      } else if (type === FavoriteType.SHOP) {
        favorite = await this.prisma.collectShop.create({
          data: {
            userId,
            shopId: targetId,
            addTime: new Date(),
          },
        });
      } else {
        throw new BadRequestException("暂不支持文章收藏");
      }
      return {
        message: "收藏成功",
        isFavorited: true,
        favorite: this.formatFavoriteResponse(favorite, type),
      };
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
    // 暂不支持文章收藏
    return {
      list: [],
      total: 0,
      page: query.page || 1,
      size: query.size || 10,
      totalPages: 0,
    };
  }

  /**
   * 验证目标是否存在
   */
  private async validateTargetExists(targetId: number, type: FavoriteType) {
    switch (type) {
      case FavoriteType.PRODUCT:
        const product = await this.prisma.product.findFirst({
          where: { productId: targetId },
        });
        if (!product) {
          throw new NotFoundException("商品不存在");
        }
        break;
      case FavoriteType.SHOP:
        const shop = await this.prisma.shop.findFirst({
          where: { shopId: targetId },
        });
        if (!shop) {
          throw new NotFoundException("店铺不存在");
        }
        break;
      case FavoriteType.ARTICLE:
        const article = await this.prisma.article.findFirst({
          where: { articleId: targetId },
        });
        if (!article) {
          throw new NotFoundException("文章不存在");
        }
        break;
      default:
        throw new BadRequestException("无效的收藏类型");
    }
  }

  /**
   * 获取目标信息
   */
  private async getTargetInfo(targetId: number, type: FavoriteType) {
    switch (type) {
      case FavoriteType.PRODUCT:
        const product = await this.prisma.product.findFirst({
          where: { productId: targetId },
          select: {
            productId: true,
            productName: true,
            picThumb: true,
            productPrice: true,
          },
        });
        return product
          ? {
              id: product.productId,
              name: product.productName,
              image: product.picThumb,
              price: Number(product.productPrice),
            }
          : null;
      case FavoriteType.SHOP:
        const shop = await this.prisma.shop.findFirst({
          where: { shopId: targetId },
          select: {
            shopId: true,
            shopTitle: true,
            shopLogo: true,
          },
        });
        return shop
          ? {
              id: shop.shopId,
              name: shop.shopTitle,
              image: shop.shopLogo,
            }
          : null;
      case FavoriteType.ARTICLE:
        const article = await this.prisma.article.findFirst({
          where: { articleId: targetId },
          select: {
            articleId: true,
            title: true,
            image: true,
          },
        });
        return article
          ? {
              id: article.articleId,
              name: article.title,
              image: article.image,
            }
          : null;
      default:
        return null;
    }
  }

  /**
   * 格式化收藏响应
   */
  private formatFavoriteResponse(
    favorite: any,
    type: FavoriteType,
    targetInfo?: any,
  ): FavoriteResponse {
    return {
      id: favorite.collectId || favorite.id,
      userId: favorite.userId,
      targetId:
        type === FavoriteType.PRODUCT ? favorite.productId : favorite.shopId,
      type,
      remark: favorite.remark,
      targetInfo,
      createdAt: favorite.addTime || favorite.createdAt,
      updatedAt: favorite.addTime || favorite.updatedAt,
    };
  }
}
