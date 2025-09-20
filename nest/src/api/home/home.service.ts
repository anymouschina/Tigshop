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
    const products = await this.getHotProductsData(query);
    return {
      code: 200,
      message: '获取成功',
      data: products,
    };
  }

  async getNewProducts(query: { page?: number; size?: number }) {
    const products = await this.getNewProductsData(query);
    return {
      code: 200,
      message: '获取成功',
      data: products,
    };
  }

  async getRecommendProducts(userId: number, query: { page?: number; size?: number }) {
    const products = await this.getRecommendProductsData(userId, query);
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
    const coupons = await this.getAvailableCouponsData(query);
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
    const shops = await this.getRecommendShopsData(query);
    return {
      code: 200,
      message: '获取成功',
      data: shops,
    };
  }

  async getNewsList(query: { page?: number; size?: number; category_id?: number }) {
    const news = await this.getNewsListData(query);
    return {
      code: 200,
      message: '获取成功',
      data: news,
    };
  }

  // 私有方法实现
  private async getBannersData() {
    const banners = await this.prisma.ad_banner.findMany({
      where: {
        position: 'home',
        status: 1,
        start_time: { lte: Math.floor(Date.now() / 1000) },
        end_time: { gte: Math.floor(Date.now() / 1000) },
      },
      orderBy: { sort_order: 'asc' },
      select: {
        banner_id: true,
        title: true,
        image: true,
        link_url: true,
        link_type: true,
        start_time: true,
        end_time: true,
      },
    });

    return banners;
  }

  private async getHomeCategoriesData() {
    const categories = await this.prisma.category.findMany({
      where: {
        parent_id: 0,
        is_show: 1,
        is_delete: 0,
      },
      orderBy: { sort_order: 'asc' },
      select: {
        category_id: true,
        category_name: true,
        image: true,
        category_code: true,
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
          is_show: 1,
          is_delete: 0,
          stock: { gt: 0 },
          is_hot: 1,
        },
        include: {
          shop: {
            select: {
              shop_id: true,
              shop_name: true,
            },
          },
        },
        orderBy: { sales_count: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.product.count({
        where: {
          is_show: 1,
          is_delete: 0,
          stock: { gt: 0 },
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
          is_show: 1,
          is_delete: 0,
          stock: { gt: 0 },
          is_new: 1,
        },
        include: {
          shop: {
            select: {
              shop_id: true,
              shop_name: true,
            },
          },
        },
        orderBy: { add_time: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.product.count({
        where: {
          is_show: 1,
          is_delete: 0,
          stock: { gt: 0 },
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
      is_show: 1,
      is_delete: 0,
      stock: { gt: 0 },
      is_recommend: 1,
    };

    // 如果用户已登录，可以根据用户行为推荐
    if (userId > 0) {
      // 这里可以实现基于用户行为的个性化推荐
      // 例如：根据浏览历史、购买记录等
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          shop: {
            select: {
              shop_id: true,
              shop_name: true,
            },
          },
        },
        orderBy: { sort_order: 'asc' },
        skip,
        take: size,
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
    const activities = await this.prisma.promotion.findMany({
      where: {
        is_delete: 0,
        is_available: 1,
        start_time: { lte: Math.floor(Date.now() / 1000) },
        end_time: { gte: Math.floor(Date.now() / 1000) },
      },
      orderBy: { sort_order: 'asc' },
      select: {
        promotion_id: true,
        promotion_name: true,
        promotion_desc: true,
        promotion_type: true,
        image: true,
        start_time: true,
        end_time: true,
      },
    });

    return activities;
  }

  private async getAvailableCouponsData(query: { page: number; size: number }) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where: {
          is_delete: 0,
          status: 1,
          start_time: { lte: Math.floor(Date.now() / 1000) },
          end_time: { gte: Math.floor(Date.now() / 1000) },
        },
        orderBy: { sort_order: 'asc' },
        skip,
        take: size,
      }),
      this.prisma.coupon.count({
        where: {
          is_delete: 0,
          status: 1,
          start_time: { lte: Math.floor(Date.now() / 1000) },
          end_time: { gte: Math.floor(Date.now() / 1000) },
        },
      }),
    ]);

    return {
      records: coupons,
      total,
      page,
      size,
    };
  }

  private async getSeckillProductsData() {
    const currentTime = Math.floor(Date.now() / 1000);

    const seckillProducts = await this.prisma.seckill_product.findMany({
      where: {
        is_delete: 0,
        status: 1,
        start_time: { lte: currentTime },
        end_time: { gte: currentTime },
      },
      include: {
        product: {
          select: {
            product_id: true,
            product_name: true,
            image: true,
            price: true,
          },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    return seckillProducts;
  }

  private async getGrouponProductsData() {
    const currentTime = Math.floor(Date.now() / 1000);

    const grouponProducts = await this.prisma.groupon_product.findMany({
      where: {
        is_delete: 0,
        status: 1,
        start_time: { lte: currentTime },
        end_time: { gte: currentTime },
      },
      include: {
        product: {
          select: {
            product_id: true,
            product_name: true,
            image: true,
            price: true,
          },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    return grouponProducts;
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
        where: { user_id: userId, is_delete: 0 },
        _count: { order_id: true },
      }),
      this.prisma.cart.count({ where: { user_id: userId } }),
      this.prisma.user_collect.count({ where: { user_id: userId } }),
      this.prisma.user_coupon.count({
        where: {
          user_id: userId,
          status: 0,
          coupon: {
            end_time: { gte: Math.floor(Date.now() / 1000) },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { points: true },
      }),
      this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { user_money: true },
      }),
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
      balance: balance?.user_money || 0,
    };
  }

  private async getRecommendShopsData(query: { page: number; size: number }) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where: {
          status: 1,
          is_delete: 0,
          is_recommend: 1,
        },
        select: {
          shop_id: true,
          shop_name: true,
          shop_logo: true,
          description: true,
          rating: true,
          product_count: true,
        },
        orderBy: { sort_order: 'asc' },
        skip,
        take: size,
      }),
      this.prisma.shop.count({
        where: {
          status: 1,
          is_delete: 0,
          is_recommend: 1,
        },
      }),
    ]);

    return {
      records: shops,
      total,
      page,
      size,
    };
  }

  private async getNewsListData(query: { page: number; size: number; category_id?: number }) {
    const { page = 1, size = 10, category_id } = query;
    const skip = (page - 1) * size;

    const where: any = {
      status: 1,
      is_delete: 0,
    };

    if (category_id) {
      where.category_id = category_id;
    }

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        include: {
          category: {
            select: {
              category_id: true,
              category_name: true,
            },
          },
        },
        orderBy: { add_time: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.news.count({ where }),
    ]);

    return {
      records: news,
      total,
      page,
      size,
    };
  }
}