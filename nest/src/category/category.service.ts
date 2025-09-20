// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取当前分类的父级分类
   */
  async getParentCategoryTree(categoryId: number) {
    if (categoryId === 0) {
      return [];
    }

    // 获取分类路径
    const category = await this.prisma.productCategory.findUnique({
      where: { category_id: categoryId },
    });

    if (!category) {
      return [];
    }

    const path = category.path ? category.path.split(',') : [];
    const parentIds = path.filter(id => parseInt(id) !== categoryId).map(id => parseInt(id));

    if (parentIds.length === 0) {
      return [];
    }

    const parents = await this.prisma.productCategory.findMany({
      where: {
        category_id: {
          in: parentIds,
        },
      },
      orderBy: [
        { level: 'asc' },
      ],
    });

    return parents;
  }

  /**
   * 根据上级获得指定分类
   */
  async getCategoryList(parentId: number) {
    const categories = await this.prisma.productCategory.findMany({
      where: {
        parent_id: parentId,
        is_show: 1,
      },
      orderBy: [
        { sort_order: 'desc' },
        { category_id: 'asc' },
      ],
    });

    return categories;
  }

  /**
   * 获取所有分类
   */
  async getAllCategories() {
    const categories = await this.prisma.productCategory.findMany({
      where: {
        is_show: 1,
      },
      orderBy: [
        { parent_id: 'asc' },
        { sort_order: 'desc' },
        { category_id: 'asc' },
      ],
    });

    return categories;
  }

  /**
   * 商品相关分类信息
   */
  async getRelateInfo(query: {
    product_id?: number;
    size?: number;
    rank_num?: number;
    intro?: string;
  }) {
    const { product_id = 0, size = 10, rank_num = 5, intro = 'hot' } = query;

    // 获取分类ID
    const product = await this.prisma.product.findUnique({
      where: { product_id },
      select: { category_id: true },
    });

    if (!product) {
      return {
        cate_info: [],
        brand_info: [],
        cate_ranke: [],
        article_list: [],
        look_also: [],
        filter: query,
      };
    }

    const categoryId = product.category_id;

    // 并行获取所有相关数据
    const [relateCate, relatedBrand, cateRank, articleList, lookAlso] = await Promise.all([
      this.getRelatedCategory(categoryId, { ...query, size }),
      this.getOtherBrand(categoryId, { ...query, size }),
      this.getCategoryRank(categoryId, { ...query, size: rank_num }),
      this.getArticleList({ ...query, size }),
      this.getLookAlso(categoryId, { ...query, size }),
    ]);

    return {
      cate_info: relateCate,
      brand_info: relatedBrand,
      cate_ranke: cateRank,
      article_list: articleList,
      look_also: lookAlso,
      filter: query,
    };
  }

  /**
   * 获取相关分类
   */
  async getRelateCategory(query: {
    product_id?: number;
    size?: number;
    rank_num?: number;
    intro?: string;
  }) {
    const { product_id = 0, size = 10 } = query;

    const product = await this.prisma.product.findUnique({
      where: { product_id },
      select: { category_id: true },
    });

    if (!product) {
      return [];
    }

    return this.getRelatedCategory(product.category_id, { ...query, size });
  }

  /**
   * 获取相关品牌
   */
  async getRelateBrand(query: {
    product_id?: number;
    size?: number;
    rank_num?: number;
    intro?: string;
  }) {
    const { product_id = 0, size = 10 } = query;

    const product = await this.prisma.product.findUnique({
      where: { product_id },
      select: { category_id: true },
    });

    if (!product) {
      return [];
    }

    return this.getOtherBrand(product.category_id, { ...query, size });
  }

  /**
   * 获取相关文章
   */
  async getRelateArticle(query: {
    product_id?: number;
    size?: number;
    rank_num?: number;
    intro?: string;
  }) {
    return this.getArticleList(query);
  }

  /**
   * 获取相关排行
   */
  async getRelateRank(query: {
    product_id?: number;
    size?: number;
    rank_num?: number;
    intro?: string;
  }) {
    const { product_id = 0, rank_num = 5 } = query;

    const product = await this.prisma.product.findUnique({
      where: { product_id },
      select: { category_id: true },
    });

    if (!product) {
      return [];
    }

    return this.getCategoryRank(product.category_id, { ...query, size: rank_num });
  }

  /**
   * 获取相关看了还看
   */
  async getRelateLookAlso(query: {
    product_id?: number;
    size?: number;
    rank_num?: number;
    intro?: string;
  }) {
    const { product_id = 0, size = 10 } = query;

    const product = await this.prisma.product.findUnique({
      where: { product_id },
      select: { category_id: true },
    });

    if (!product) {
      return [];
    }

    return this.getLookAlso(product.category_id, { ...query, size });
  }

  /**
   * 获取热门分类
   */
  async getHotCategories() {
    const categories = await this.prisma.productCategory.findMany({
      where: {
        is_show: 1,
        is_hot: 1,
      },
      orderBy: [
        { sort_order: 'desc' },
        { category_id: 'asc' },
      ],
      take: 10,
    });

    return categories.map(category => ({
      ...category,
      category_name: this.lang(category.category_name),
    }));
  }

  /**
   * 获取相关分类（内部方法）
   */
  private async getRelatedCategory(categoryId: number, query: { size?: number }) {
    const { size = 10 } = query;

    // 获取同级别的分类
    const currentCategory = await this.prisma.productCategory.findUnique({
      where: { category_id: categoryId },
    });

    if (!currentCategory) {
      return [];
    }

    const relatedCategories = await this.prisma.productCategory.findMany({
      where: {
        parent_id: currentCategory.parent_id,
        category_id: { not: categoryId },
        is_show: 1,
      },
      orderBy: [
        { sort_order: 'desc' },
        { category_id: 'asc' },
      ],
      take: size,
    });

    return relatedCategories.map(category => ({
      ...category,
      category_name: this.lang(category.category_name),
    }));
  }

  /**
   * 获取同类其他品牌（内部方法）
   */
  private async getOtherBrand(categoryId: number, query: { size?: number }) {
    const { size = 10 } = query;

    // 获取该分类下的品牌
    const products = await this.prisma.product.findMany({
      where: {
        category_id: categoryId,
        is_show: 1,
        brand_id: { not: null },
      },
      select: {
        brand_id: true,
      },
      distinct: ['brand_id'],
      take: size,
    });

    const brandIds = products.map(p => p.brand_id).filter(id => id !== null);

    if (brandIds.length === 0) {
      return [];
    }

    const brands = await this.prisma.productBrand.findMany({
      where: {
        brand_id: {
          in: brandIds,
        },
        is_show: 1,
      },
      orderBy: [
        { sort_order: 'desc' },
        { brand_id: 'asc' },
      ],
    });

    return brands;
  }

  /**
   * 获取分类排行榜（内部方法）
   */
  private async getCategoryRank(categoryId: number, query: { size?: number }) {
    const { size = 5 } = query;

    const products = await this.prisma.product.findMany({
      where: {
        category_id: categoryId,
        is_show: 1,
      },
      orderBy: [
        { sales_count: 'desc' },
      ],
      take: size,
    });

    return products;
  }

  /**
   * 获取文章列表（内部方法）
   */
  private async getArticleList(query: { size?: number }) {
    const { size = 10 } = query;

    const articles = await this.prisma.article.findMany({
      where: {
        is_show: 1,
      },
      orderBy: [
        { sort_order: 'desc' },
        { article_id: 'desc' },
      ],
      take: size,
    });

    return articles;
  }

  /**
   * 获取看了还看（内部方法）
   */
  private async getLookAlso(categoryId: number, query: { size?: number }) {
    const { size = 10 } = query;

    const products = await this.prisma.product.findMany({
      where: {
        category_id: categoryId,
        is_show: 1,
      },
      orderBy: [
        { view_count: 'desc' },
      ],
      take: size,
    });

    return products;
  }

  /**
   * 语言处理（简化版）
   */
  private lang(text: string): string {
    // 这里应该实现多语言处理
    return text;
  }
}
