import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getCategoryList(parentId: number = 0) {
    const categories = await this.prisma.category.findMany({
      where: {
        parent_id: parentId,
        is_show: 1,
        is_delete: 0,
      },
      orderBy: { sort_order: 'asc' },
      include: {
        children: {
          where: {
            is_show: 1,
            is_delete: 0,
          },
          select: {
            category_id: true,
            category_name: true,
            image: true,
          },
        },
      },
    });

    return {
      code: 200,
      message: '获取成功',
      data: categories,
    };
  }

  async getCategoryTree() {
    const categories = await this.prisma.category.findMany({
      where: {
        is_show: 1,
        is_delete: 0,
      },
      orderBy: { sort_order: 'asc' },
    });

    const tree = this.buildCategoryTree(categories, 0);

    return {
      code: 200,
      message: '获取成功',
      data: tree,
    };
  }

  async getCategoryDetail(categoryId: number) {
    const category = await this.prisma.category.findFirst({
      where: {
        category_id: categoryId,
        is_show: 1,
        is_delete: 0,
      },
      include: {
        parent: {
          select: {
            category_id: true,
            category_name: true,
          },
        },
        children: {
          where: {
            is_show: 1,
            is_delete: 0,
          },
          select: {
            category_id: true,
            category_name: true,
            image: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return {
      code: 200,
      message: '获取成功',
      data: category,
    };
  }

  async getCategoryProducts(
    categoryId: number,
    query: {
      page?: number;
      size?: number;
      sort_field?: string;
      sort_order?: 'asc' | 'desc';
      price_min?: number;
      price_max?: number;
      keyword?: string;
    }
  ) {
    const {
      page = 1,
      size = 20,
      sort_field = 'sort_order',
      sort_order = 'asc',
      price_min,
      price_max,
      keyword,
    } = query;
    const skip = (page - 1) * size;

    // 验证分类是否存在
    const category = await this.prisma.category.findFirst({
      where: {
        category_id: categoryId,
        is_show: 1,
        is_delete: 0,
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 获取分类ID及其所有子分类ID
    const categoryIds = await this.getCategoryIdsWithChildren(categoryId);

    const where: any = {
      category_id: { in: categoryIds },
      is_show: 1,
      is_delete: 0,
      stock: { gt: 0 },
    };

    if (price_min !== undefined) {
      where.price = { gte: price_min };
    }

    if (price_max !== undefined) {
      where.price = { ...where.price, lte: price_max };
    }

    if (keyword) {
      where.product_name = { contains: keyword };
    }

    const orderBy: any = {};
    orderBy[sort_field] = sort_order;

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
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records: products,
        total,
        page,
        size,
      },
    };
  }

  async getHotProducts(categoryId: number, limit: number = 10) {
    const categoryIds = await this.getCategoryIdsWithChildren(categoryId);

    const products = await this.prisma.product.findMany({
      where: {
        category_id: { in: categoryIds },
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
      take: limit,
    });

    return {
      code: 200,
      message: '获取成功',
      data: products,
    };
  }

  async getNewProducts(categoryId: number, limit: number = 10) {
    const categoryIds = await this.getCategoryIdsWithChildren(categoryId);

    const products = await this.prisma.product.findMany({
      where: {
        category_id: { in: categoryIds },
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
      take: limit,
    });

    return {
      code: 200,
      message: '获取成功',
      data: products,
    };
  }

  async getCategoryFilter(categoryId: number) {
    const categoryIds = await this.getCategoryIdsWithChildren(categoryId);

    // 获取价格范围
    const priceStats = await this.prisma.product.aggregate({
      where: {
        category_id: { in: categoryIds },
        is_show: 1,
        is_delete: 0,
        stock: { gt: 0 },
      },
      _min: { price: true },
      _max: { price: true },
    });

    // 获取品牌列表
    const brands = await this.prisma.product.findMany({
      where: {
        category_id: { in: categoryIds },
        is_show: 1,
        is_delete: 0,
        stock: { gt: 0 },
        brand_id: { not: null },
      },
      include: {
        brand: true,
      },
      distinct: ['brand_id'],
    });

    // 获取子分类
    const children = await this.prisma.category.findMany({
      where: {
        parent_id: categoryId,
        is_show: 1,
        is_delete: 0,
      },
      orderBy: { sort_order: 'asc' },
    });

    return {
      code: 200,
      message: '获取成功',
      data: {
        price_range: {
          min: priceStats._min.price || 0,
          max: priceStats._max.price || 0,
        },
        brands: brands.map(item => item.brand).filter(Boolean),
        children: children,
      },
    };
  }

  async getRecommendCategories() {
    const categories = await this.prisma.category.findMany({
      where: {
        is_show: 1,
        is_delete: 0,
        is_recommend: 1,
      },
      orderBy: { sort_order: 'asc' },
      take: 10,
    });

    return {
      code: 200,
      message: '获取成功',
      data: categories,
    };
  }

  async getCategoryBreadcrumb(categoryId: number) {
    const breadcrumb = [];
    let currentCategory = await this.prisma.category.findFirst({
      where: {
        category_id: categoryId,
        is_show: 1,
        is_delete: 0,
      },
    });

    if (!currentCategory) {
      throw new NotFoundException('分类不存在');
    }

    while (currentCategory) {
      breadcrumb.unshift({
        category_id: currentCategory.category_id,
        category_name: currentCategory.category_name,
      });

      if (currentCategory.parent_id === 0) {
        break;
      }

      currentCategory = await this.prisma.category.findFirst({
        where: {
          category_id: currentCategory.parent_id,
        },
      });
    }

    return {
      code: 200,
      message: '获取成功',
      data: breadcrumb,
    };
  }

  async getCategoryStatistics(categoryId: number) {
    const categoryIds = await this.getCategoryIdsWithChildren(categoryId);

    const [
      productCount,
      totalSales,
      avgPrice,
      hotProductCount,
      newProductCount,
    ] = await Promise.all([
      this.prisma.product.count({
        where: {
          category_id: { in: categoryIds },
          is_show: 1,
          is_delete: 0,
        },
      }),
      this.prisma.product.aggregate({
        where: {
          category_id: { in: categoryIds },
          is_show: 1,
          is_delete: 0,
        },
        _sum: { sales_count: true },
      }),
      this.prisma.product.aggregate({
        where: {
          category_id: { in: categoryIds },
          is_show: 1,
          is_delete: 0,
        },
        _avg: { price: true },
      }),
      this.prisma.product.count({
        where: {
          category_id: { in: categoryIds },
          is_show: 1,
          is_delete: 0,
          is_hot: 1,
        },
      }),
      this.prisma.product.count({
        where: {
          category_id: { in: categoryIds },
          is_show: 1,
          is_delete: 0,
          is_new: 1,
        },
      }),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        product_count: productCount,
        total_sales: totalSales._sum.sales_count || 0,
        avg_price: avgPrice._avg.price || 0,
        hot_product_count: hotProductCount,
        new_product_count: newProductCount,
      },
    };
  }

  async getChildrenCategories(categoryId: number) {
    const children = await this.prisma.category.findMany({
      where: {
        parent_id: categoryId,
        is_show: 1,
        is_delete: 0,
      },
      orderBy: { sort_order: 'asc' },
    });

    return {
      code: 200,
      message: '获取成功',
      data: children,
    };
  }

  // 私有方法
  private buildCategoryTree(categories: any[], parentId: number) {
    const tree = [];

    for (const category of categories) {
      if (category.parent_id === parentId) {
        const children = this.buildCategoryTree(categories, category.category_id);
        if (children.length > 0) {
          category.children = children;
        }
        tree.push(category);
      }
    }

    return tree;
  }

  private async getCategoryIdsWithChildren(categoryId: number): Promise<number[]> {
    const categoryIds = [categoryId];

    const getChildrenIds = async (parentId: number) => {
      const children = await this.prisma.category.findMany({
        where: {
          parent_id: parentId,
          is_show: 1,
          is_delete: 0,
        },
        select: { category_id: true },
      });

      for (const child of children) {
        categoryIds.push(child.category_id);
        await getChildrenIds(child.category_id);
      }
    };

    await getChildrenIds(categoryId);
    return [...new Set(categoryIds)];
  }
}