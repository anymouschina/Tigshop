import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  async getHomeData(userId: number = 0) {
    // 并行获取首页各项数据
    const [
      banners,
      categories,
      hotProducts,
      newProducts,
      recommendProducts,
      promotionActivities,
      availableCoupons,
      userStatistics,
      recommendShops,
    ] = await Promise.all([
      this.getBannersData(),
      this.getHomeCategoriesData(),
      this.getHotProductsData({ page: 1, size: 8 }),
      this.getNewProductsData({ page: 1, size: 8 }),
      this.getRecommendProductsData(userId, { page: 1, size: 8 }),
      this.getPromotionActivitiesData(),
      this.getAvailableCouponsData({ page: 1, size: 5 }),
      userId > 0 ? this.getUserStatisticsData(userId) : Promise.resolve(null),
      this.getRecommendShopsData({ page: 1, size: 6 }),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        banners,
        categories,
        hot_products: hotProducts,
        new_products: newProducts,
        recommend_products: recommendProducts,
        promotion_activities: promotionActivities,
        available_coupons: availableCoupons,
        user_statistics: userStatistics,
        recommend_shops: recommendShops,
      },
    };
  }

  async getBanners() {
    const banners = await this.getBannersData();
    return {
      code: 200,
      message: '获取成功',
      data: banners,
    };
  }

  async getHomeCategories() {
    const categories = await this.getHomeCategoriesData();
    return {
      code: 200,
      message: '获取成功',
      data: categories,
    };
  }

  async getHotProducts(query: { page?: number; size?: number }) {
    const validatedQuery = { page: query.page || 1, size: query.size || 8 };
    const products = await this.getHotProductsData(validatedQuery);
    return {
      code: 200,
      message: '获取成功',
      data: products,
    };
  }

  async getNewProducts(query: { page?: number; size?: number }) {
    const validatedQuery = { page: query.page || 1, size: query.size || 8 };
    const products = await this.getNewProductsData(validatedQuery);
    return {
      code: 200,
      message: '获取成功',
      data: products,
    };
  }

  async getRecommendProducts(userId: number, query: { page?: number; size?: number }) {
    const validatedQuery = { page: query.page || 1, size: query.size || 8 };
    const products = await this.getRecommendProductsData(userId, validatedQuery);
    return {
      code: 200,
      message: '获取成功',
      data: products,
    };
  }

  async getPromotionActivities() {
    const activities = await this.getPromotionActivitiesData();
    return {
      code: 200,
      message: '获取成功',
      data: activities,
    };
  }

  async getAvailableCoupons(query: { page?: number; size?: number }) {
    const validatedQuery = { page: query.page || 1, size: query.size || 5 };
    const coupons = await this.getAvailableCouponsData(validatedQuery);
    return {
      code: 200,
      message: '获取成功',
      data: coupons,
    };
  }

  async getSeckillProducts() {
    const seckillProducts = await this.getSeckillProductsData();
    return {
      code: 200,
      message: '获取成功',
      data: seckillProducts,
    };
  }

  async getGrouponProducts() {
    const grouponProducts = await this.getGrouponProductsData();
    return {
      code: 200,
      message: '获取成功',
      data: grouponProducts,
    };
  }

  async getUserStatistics(userId: number) {
    const statistics = await this.getUserStatisticsData(userId);
    return {
      code: 200,
      message: '获取成功',
      data: statistics,
    };
  }

  async getRecommendShops(query: { page?: number; size?: number }) {
    const validatedQuery = { page: query.page || 1, size: query.size || 6 };
    const shops = await this.getRecommendShopsData(validatedQuery);
    return {
      code: 200,
      message: '获取成功',
      data: shops,
    };
  }

  async getNewsList(query: { page?: number; size?: number; category_id?: number }) {
    const validatedQuery = { page: query.page || 1, size: query.size || 10, category_id: query.category_id };
    const news = await this.getNewsListData(validatedQuery);
    return {
      code: 200,
      message: '获取成功',
      data: news,
    };
  }

  // 私有方法实现
  private async getBannersData() {
    // No banner model in schema; return empty list as placeholder
    return [] as any[];
  }

  private async getHomeCategoriesData() {
    const categories = await this.prisma.category.findMany({
      where: { parent_id: 0, is_show: 1 },
      orderBy: { sort_order: 'asc' },
      select: {
        category_id: true,
        category_name: true,
        category_pic: true,
      },
    });

    return categories;
  }

  private async getHotProductsData(query: { page: number; size: number }) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          product_status: 1,
          is_delete: 0,
          product_stock: { gt: 0 } as any,
          is_hot: 1,
        },
        orderBy: { virtual_sales: 'desc' },
        skip,
        take: size,
        select: {
          product_id: true,
          product_name: true,
          pic_thumb: true,
          product_price: true,
          market_price: true,
          shop_id: true,
        },
      }),
      this.prisma.product.count({
        where: {
          product_status: 1,
          is_delete: 0,
          product_stock: { gt: 0 } as any,
          is_hot: 1,
        },
      }),
    ]);

    return {
      records: products,
      total,
      page,
      size,
    };
  }

  private async getNewProductsData(query: { page: number; size: number }) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          product_status: 1,
          is_delete: 0,
          product_stock: { gt: 0 } as any,
          is_new: 1,
        },
        orderBy: { add_time: 'desc' },
        skip,
        take: size,
        select: {
          product_id: true,
          product_name: true,
          pic_thumb: true,
          product_price: true,
          market_price: true,
          shop_id: true,
        },
      }),
      this.prisma.product.count({
        where: {
          product_status: 1,
          is_delete: 0,
          product_stock: { gt: 0 } as any,
          is_new: 1,
        },
      }),
    ]);

    return {
      records: products,
      total,
      page,
      size,
    };
  }

  private async getRecommendProductsData(userId: number, query: { page: number; size: number }) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    let where: any = {
      product_status: 1,
      is_delete: 0,
      product_stock: { gt: 0 } as any,
      is_best: 1,
    };

    // 如果用户已登录，可以根据用户行为推荐
    if (userId > 0) {
      // 这里可以实现基于用户行为的个性化推荐
      // 例如：根据浏览历史、购买记录等
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { sort_order: 'asc' },
        skip,
        take: size,
        select: {
          product_id: true,
          product_name: true,
          pic_thumb: true,
          product_price: true,
          market_price: true,
          shop_id: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      records: products,
      total,
      page,
      size,
    };
  }

  private async getPromotionActivitiesData() {
    const nowSec = Math.floor(Date.now() / 1000);
    const activities = await this.prisma.promotion.findMany({
      where: {
        is_delete: false as any,
        is_available: 1 as any,
        start_time: { lte: nowSec },
        end_time: { gte: nowSec },
      },
      select: {
        promotion_id: true,
        promotion_name: true,
        start_time: true,
        end_time: true,
        type: true,
      },
      orderBy: { end_time: 'asc' },
    });

    return activities;
  }

  private async getAvailableCouponsData(query: { page: number; size: number }) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const now = Math.floor(Date.now() / 1000);
    const where: any = {
      is_delete: false as any,
      is_show: 1 as any,
      use_start_date: { lte: now } as any,
      use_end_date: { gte: now } as any,
    };
    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({ where, orderBy: { add_time: 'desc' }, skip, take: size }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      records: coupons,
      total,
      page,
      size,
    };
  }

  private async getSeckillProductsData() {
    // Seckill feature not modeled; return empty list
    return [] as any[];
  }

  private async getGrouponProductsData() {
    // Groupon feature not modeled; return empty list
    return [] as any[];
  }

  private async getUserStatisticsData(userId: number) {
    const [
      orderStats,
      cartCount,
      favoriteCount,
      couponCount,
      points,
      balance,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['order_status'],
        where: { user_id: userId, is_del: 0 },
        _count: { order_id: true },
      }),
      this.prisma.cart.count({ where: { user_id: userId } }),
      (async () => {
        const [p, s] = await Promise.all([
          this.prisma.collect_product.count({ where: { user_id: userId } }),
          this.prisma.collect_shop ? (this.prisma as any).collect_shop.count({ where: { user_id: userId } }) : Promise.resolve(0),
        ]);
        return p + (s || 0);
      })(),
      this.prisma.user_coupon.count({
        where: {
          user_id: userId,
          used_time: 0 as any,
          end_date: { gte: Math.floor(Date.now() / 1000) } as any,
        },
      }),
      this.prisma.user.findUnique({ where: { user_id: userId }, select: { points: true } }),
      this.prisma.user.findUnique({ where: { user_id: userId }, select: { balance: true } }),
    ]);

    const orderCountMap = {};
    orderStats.forEach(stat => {
      orderCountMap[stat.order_status] = stat._count.order_id;
    });

    return {
      order_stats: {
        pending_payment: orderCountMap[1] || 0,
        pending_delivery: orderCountMap[2] || 0,
        pending_receipt: orderCountMap[3] || 0,
        completed: orderCountMap[4] || 0,
      },
      cart_count: cartCount,
      favorite_count: favoriteCount,
      coupon_count: couponCount,
      points: points?.points || 0,
      balance: (balance as any)?.balance || 0,
    };
  }

  private async getRecommendShopsData(query: { page: number; size: number }) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where: { status: 1 as any },
        select: {
          shop_id: true,
          shop_title: true,
          shop_logo: true,
          description: true,
        },
        orderBy: { click_count: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.shop.count({ where: { status: 1 as any } }),
    ]);

    return {
      records: shops,
      total,
      page,
      size,
    };
  }

  private async getNewsListData(query: { page: number; size: number; category_id?: number }) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    // No news model in schema; return placeholder paging structure
    return { records: [], total: 0, page, size };
  }
}
