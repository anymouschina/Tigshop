// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CollectQueryDto,
  CollectProductDto,
  CancelCollectDto,
} from "./dto/user-collect.dto";

@Injectable()
export class UserCollectService {
  constructor(private prisma: PrismaService) {}

  async getCollectList(userId: number, query: CollectQueryDto) {
    const {
      page = 1,
      size = 20,
      keyword,
      category_id,
      sort_field = "add_time",
      sort_order = "desc",
    } = query;
    const skip = (page - 1) * size;

    const where: any = {
      user_id: userId,
      is_delete: 0,
    };

    // 关联商品查询条件
    const productWhere: any = {
      is_show: 1,
      is_delete: 0,
    };

    if (keyword) {
      productWhere.product_name = { contains: keyword };
    }

    if (category_id) {
      productWhere.category_id = category_id;
    }

    const [collects, total] = await Promise.all([
      this.prisma.user_collect.findMany({
        where,
        include: {
          product: {
            where: productWhere,
            include: {
              shop: {
                select: {
                  shop_id: true,
                  shop_name: true,
                },
              },
              category: {
                select: {
                  category_id: true,
                  category_name: true,
                },
              },
            },
          },
        },
        orderBy: { [sort_field]: sort_order },
        skip,
        take: size,
      }),
      this.prisma.user_collect.count({
        where,
      }),
    ]);

    // 过滤掉已下架或删除的商品
    const validCollects = collects.filter((collect) => collect.product);

    return {
      code: 200,
      message: "获取成功",
      data: {
        records: validCollects,
        total: validCollects.length,
        page,
        size,
      },
    };
  }

  async saveCollect(userId: number, body: CollectProductDto) {
    const { product_id } = body;

    // 验证商品是否存在
    const product = await this.prisma.product.findFirst({
      where: {
        product_id,
        is_show: 1,
        is_delete: 0,
      },
    });

    if (!product) {
      throw new NotFoundException("商品不存在或已下架");
    }

    // 检查是否已收藏
    const existingCollect = await this.prisma.user_collect.findFirst({
      where: {
        user_id: userId,
        product_id,
        is_delete: 0,
      },
    });

    if (existingCollect) {
      throw new BadRequestException("商品已收藏");
    }

    // 添加收藏
    const collect = await this.prisma.user_collect.create({
      data: {
        user_id: userId,
        product_id,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "收藏成功",
      data: collect,
    };
  }

  async cancelCollect(userId: number, body: CancelCollectDto) {
    const { product_id } = body;

    const collect = await this.prisma.user_collect.findFirst({
      where: {
        user_id: userId,
        product_id,
        is_delete: 0,
      },
    });

    if (!collect) {
      throw new NotFoundException("收藏不存在");
    }

    await this.prisma.user_collect.update({
      where: { collect_id: collect.collect_id },
      data: {
        is_delete: 1,
        delete_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "取消收藏成功",
      data: null,
    };
  }

  async isCollected(userId: number, productId: number) {
    const collect = await this.prisma.user_collect.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        is_delete: 0,
      },
    });

    return {
      code: 200,
      message: "检查成功",
      data: {
        is_collected: !!collect,
      },
    };
  }

  async getCollectStatistics(userId: number) {
    const [total, todayCount, thisMonthCount, categoryStats] =
      await Promise.all([
        this.prisma.user_collect.count({
          where: { user_id: userId, is_delete: 0 },
        }),
        this.prisma.user_collect.count({
          where: {
            user_id: userId,
            is_delete: 0,
            add_time: {
              gte: Math.floor(Date.now() / 1000) - 86400, // 24小时内
            },
          },
        }),
        this.prisma.user_collect.count({
          where: {
            user_id: userId,
            is_delete: 0,
            add_time: {
              gte: Math.floor(Date.now() / 1000) - 2592000, // 30天内
            },
          },
        }),
        this.prisma.user_collect.groupBy({
          by: ["product_id"],
          where: { user_id: userId, is_delete: 0 },
          _count: true,
        }),
      ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        total,
        today_count: todayCount,
        this_month_count: thisMonthCount,
        category_count: categoryStats.length,
      },
    };
  }

  async batchCheckCollect(userId: number, productIds: number[]) {
    const collects = await this.prisma.user_collect.findMany({
      where: {
        user_id: userId,
        product_id: { in: productIds },
        is_delete: 0,
      },
    });

    const collectedMap = {};
    collects.forEach((collect) => {
      collectedMap[collect.product_id] = true;
    });

    const result = productIds.map((productId) => ({
      product_id: productId,
      is_collected: !!collectedMap[productId],
    }));

    return {
      code: 200,
      message: "检查成功",
      data: result,
    };
  }

  async batchSaveCollect(userId: number, productIds: number[]) {
    // 验证商品
    const products = await this.prisma.product.findMany({
      where: {
        product_id: { in: productIds },
        is_show: 1,
        is_delete: 0,
      },
    });

    const validProductIds = products.map((p) => p.product_id);
    const invalidProductIds = productIds.filter(
      (id) => !validProductIds.includes(id),
    );

    if (invalidProductIds.length > 0) {
      throw new BadRequestException(
        `部分商品不存在或已下架: ${invalidProductIds.join(",")}`,
      );
    }

    // 检查已收藏的商品
    const existingCollects = await this.prisma.user_collect.findMany({
      where: {
        user_id: userId,
        product_id: { in: validProductIds },
        is_delete: 0,
      },
    });

    const existingProductIds = existingCollects.map((c) => c.product_id);
    const newProductIds = validProductIds.filter(
      (id) => !existingProductIds.includes(id),
    );

    // 批量添加新收藏
    if (newProductIds.length > 0) {
      const collectData = newProductIds.map((productId) => ({
        user_id: userId,
        product_id: productId,
        add_time: Math.floor(Date.now() / 1000),
      }));

      await this.prisma.user_collect.createMany({
        data: collectData,
      });
    }

    return {
      code: 200,
      message: "批量收藏成功",
      data: {
        success_count: newProductIds.length,
        skip_count: existingProductIds.length,
      },
    };
  }

  async batchCancelCollect(userId: number, productIds: number[]) {
    const result = await this.prisma.user_collect.updateMany({
      where: {
        user_id: userId,
        product_id: { in: productIds },
        is_delete: 0,
      },
      data: {
        is_delete: 1,
        delete_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "批量取消收藏成功",
      data: {
        affected_count: result.count,
      },
    };
  }

  async getRecommendCollect(userId: number, limit: number) {
    // 基于用户收藏历史推荐相关商品
    const userCategories = await this.prisma.user_collect.findMany({
      where: { user_id: userId, is_delete: 0 },
      include: {
        product: {
          select: { category_id: true },
        },
      },
    });

    const categoryIds = [
      ...new Set(userCategories.map((c) => c.product.category_id)),
    ];

    const recommendProducts = await this.prisma.product.findMany({
      where: {
        category_id: { in: categoryIds },
        is_show: 1,
        is_delete: 0,
        is_recommend: 1,
        stock: { gt: 0 },
      },
      include: {
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
          },
        },
      },
      orderBy: { sort_order: "asc" },
      take: limit,
    });

    return {
      code: 200,
      message: "获取成功",
      data: recommendProducts,
    };
  }

  async getCollectCategories(userId: number) {
    const categoryStats = await this.prisma.user_collect.groupBy({
      by: ["product_id"],
      where: { user_id: userId, is_delete: 0 },
      _count: true,
    });

    const productIds = categoryStats.map((stat) => stat.product_id);

    const products = await this.prisma.product.findMany({
      where: { product_id: { in: productIds } },
      include: {
        category: {
          select: {
            category_id: true,
            category_name: true,
          },
        },
      },
    });

    const categoryMap = {};
    products.forEach((product) => {
      const categoryId = product.category.category_id;
      const categoryName = product.category.category_name;
      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          category_id: categoryId,
          category_name: categoryName,
          count: 0,
        };
      }
      categoryMap[categoryId].count++;
    });

    return {
      code: 200,
      message: "获取成功",
      data: Object.values(categoryMap),
    };
  }

  async getRecentCollect(userId: number, limit: number) {
    const recentCollects = await this.prisma.user_collect.findMany({
      where: { user_id: userId, is_delete: 0 },
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
      orderBy: { add_time: "desc" },
      take: limit,
    });

    return {
      code: 200,
      message: "获取成功",
      data: recentCollects.map((collect) => ({
        collect_id: collect.collect_id,
        product: collect.product,
        add_time: collect.add_time,
      })),
    };
  }
}
