// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

export interface SearchResult {
  id: number;
  type: "product" | "user" | "order" | "category" | "brand";
  title: string;
  description?: string;
  image?: string;
  url?: string;
  score: number;
  highlight?: string;
  metadata?: any;
}

export interface SearchOptions {
  query: string;
  type?: "product" | "user" | "order" | "category" | "brand" | "all";
  page?: number;
  limit?: number;
  sortBy?: "relevance" | "date" | "price" | "popularity";
  sortOrder?: "asc" | "desc";
  filters?: SearchFilters;
}

export interface SearchFilters {
  priceRange?: { min: number; max: number };
  category?: number[];
  brand?: number[];
  inStock?: boolean;
  hasDiscount?: boolean;
  dateRange?: { start: Date; end: Date };
  rating?: number;
}

export interface SearchSuggestions {
  query: string;
  suggestions: Array<{
    text: string;
    type: "product" | "category" | "brand" | "search";
    count?: number;
  }>;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  // 获取筛选器数据（分类、品牌、最高价、总数）
  async getFilterData(params: {
    keyword?: string;
    cat?: number;
    brand?: number;
    couponId?: number;
    pageType?: string;
    shopCategory?: number | null;
    attrs?: any[];
  }): Promise<{
    filter: {
      category: Array<{
        categoryId: number;
        categoryName: string;
        parentId: number;
        isShow: number;
      }>;
      brand: Array<{
        brandId: number;
        brandName: string;
        brandLogo: string | null;
        firstWord: string | null;
        isShow: number;
      }>;
      shopCategory: any[];
      maxPrice: number;
    };
    total: number;
  }> {
    const keyword = params.keyword?.trim() || "";
    const catId = params.cat && Number.isFinite(params.cat) ? Number(params.cat) : undefined;
    const brandId = params.brand && Number.isFinite(params.brand) ? Number(params.brand) : undefined;

    // 分类：显示的全部分类（对齐PHP：不强制仅叶子，保持 is_show=1）
    const categories = await this.prisma.category.findMany({
      where: { is_show: 1 },
      select: {
        category_id: true,
        category_name: true,
        category_pic: true,
      },
      orderBy: [
        { sort_order: "asc" },
        { category_id: "asc" },
      ],
    });

    // 品牌：显示的全部品牌（is_show=1）
    const brands = await this.prisma.brand.findMany({
      where: { is_show: 1 },
      select: {
        brand_id: true,
        brand_name: true,
        brand_logo: true,
        first_word: true,
        is_show: true,
      },
      orderBy: [
        { sort_order: "asc" },
        { brand_id: "asc" },
      ],
    });

    // 最高价（仅统计上架有效商品）
    const productWhere = this.buildProductWhereClause({
      query: keyword,
      filters: {
        category: catId ? [catId] : [],
        brand: brandId ? [brandId] : [],
      },
    });

    const agg = await this.prisma.product.aggregate({
      _max: { product_price: true },
      where: productWhere,
    });

    const total = await this.prisma.product.count({ where: productWhere });

    const filter = {
      category: categories.map((c) => ({
        categoryId: c.category_id,
        categoryName: c.category_name,
        categoryPic: c.category_pic || "",
      })),
      brand: brands.map((b) => ({
        brandId: b.brand_id,
        brandName: b.brand_name,
        brandLogo: b.brand_logo ?? "",
        firstWord: b.first_word ?? "",
        isShow: Number(b.is_show) || 0,
      })),
      shopCategory: [],
      maxPrice: agg._max.product_price ? Number(agg._max.product_price) : 0,
    };

    return { filter, total };
  }

  // 全文搜索
  async search(options: SearchOptions): Promise<{
    results: SearchResult[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    facets?: any;
    suggestions?: string[];
  }> {
    const cacheKey = `search:${JSON.stringify(options)}`;
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    const searchType = options.type || "all";

    let results: SearchResult[] = [];
    let total = 0;

    // 根据类型进行搜索
    if (searchType === "all" || searchType === "product") {
      const productResults = await this.searchProducts(options, offset, limit);
      results.push(...productResults.results);
      total += productResults.total;
    }

    if (searchType === "all" || searchType === "user") {
      const userResults = await this.searchUsers(options, offset, limit);
      results.push(...userResults.results);
      total += userResults.total;
    }

    if (searchType === "all" || searchType === "category") {
      const categoryResults = await this.searchCategories(
        options,
        offset,
        limit,
      );
      results.push(...categoryResults.results);
      total += categoryResults.total;
    }

    if (searchType === "all" || searchType === "brand") {
      const brandResults = await this.searchBrands(options, offset, limit);
      results.push(...brandResults.results);
      total += brandResults.total;
    }

    // 排序和分页
    results = this.sortResults(results, options.sortBy, options.sortOrder);
    const paginatedResults = results.slice(offset, offset + limit);

    // 缓存结果
    await this.redisService.set(
      cacheKey,
      {
        results: paginatedResults,
        total,
        page,
        limit,
        hasMore: offset + limit < results.length,
      },
      { ttl: 300 },
    );

    return {
      results: paginatedResults,
      total,
      page,
      limit,
      hasMore: offset + limit < results.length,
      suggestions: await this.getSuggestions(options.query),
    };
  }

  // 产品搜索
  private async searchProducts(
    options: SearchOptions,
    offset: number,
    limit: number,
  ): Promise<{
    results: SearchResult[];
    total: number;
  }> {
    const where = this.buildProductWhereClause(options);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          product_id: true,
          product_name: true,
          product_desc: true,
          product_brief: true,
          product_price: true,
          market_price: true,
          product_stock: true,
          pic_thumb: true,
          pic_url: true,
          is_promote: true,
          is_promote_activity: true,
          category_id: true,
          brand_id: true,
          virtual_sales: true,
          check_status: true,
          shop_id: true,
          suppliers_id: true,
          product_type: true,
          product_sn: true,
          product_status: true,
          is_best: true,
          is_new: true,
          is_hot: true,
          sort_order: true,
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const results: SearchResult[] = products.map((product) => {
      const image = product.pic_thumb || product.pic_url || undefined;
      const isOnSale = (product.is_promote ?? 0) === 1 || !!product.is_promote_activity;
      const desc = product.product_desc || product.product_brief || "";

      return {
        id: product.product_id,
        type: "product" as const,
        title: product.product_name,
        description: desc,
        image,
        url: `/products/${product.product_id}`,
        score: this.calculateRelevanceScore(
          options.query,
          product.product_name,
          desc,
        ),
        metadata: {
          price: product.product_price,
          originalPrice: product.market_price,
          stock: product.product_stock,
          isOnSale,
          categoryId: product.category_id,
          brandId: product.brand_id,
          picThumb: product.pic_thumb,
          picUrl: product.pic_url,
          virtualSales: product.virtual_sales,
          checkStatus: product.check_status,
          shopId: product.shop_id,
          suppliersId: product.suppliers_id ?? null,
          productType: product.product_type ? 1 : 0,
          productSn: product.product_sn,
          productStatus: product.product_status,
          isBest: product.is_best,
          isNew: product.is_new,
          isHot: product.is_hot,
          sortOrder: product.sort_order,
          productBrief: product.product_brief,
        },
      };
    });

    return { results, total };
  }

  // 用户搜索
  private async searchUsers(
    options: SearchOptions,
    offset: number,
    limit: number,
  ): Promise<{
    results: SearchResult[];
    total: number;
  }> {
    const where = {
      OR: [
        { username: { contains: options.query } },
        { email: { contains: options.query } },
        { mobile: { contains: options.query } },
      ],
      is_enabled: true,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          user_id: true,
          username: true,
          email: true,
          avatar: true,
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const results: SearchResult[] = users.map((user) => ({
      id: user.user_id,
      type: "user" as const,
      title: user.username,
      description: user.email,
      image: user.avatar,
      url: `/users/${user.user_id}`,
      score: this.calculateRelevanceScore(
        options.query,
        user.username,
        user.email,
      ),
    }));

    return { results, total };
  }

  // 分类搜索
  private async searchCategories(
    options: SearchOptions,
    offset: number,
    limit: number,
  ): Promise<{
    results: SearchResult[];
    total: number;
  }> {
    const where = {
      category_name: { contains: options.query },
      // schema 中无 is_enabled 字段
    } as any;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip: offset,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    const results: SearchResult[] = categories.map((category) => ({
      id: category.category_id,
      type: "category" as const,
      title: category.category_name,
      description: category.category_desc,
      image: undefined,
      url: `/categories/${category.category_id}`,
      score: this.calculateRelevanceScore(
        options.query,
        category.category_name,
        category.category_desc,
      ),
    }));

    return { results, total };
  }

  // 品牌搜索
  private async searchBrands(
    options: SearchOptions,
    offset: number,
    limit: number,
  ): Promise<{
    results: SearchResult[];
    total: number;
  }> {
    const where = {
      brand_name: { contains: options.query },
      // schema 中无 is_enabled 字段
    } as any;

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip: offset,
        take: limit,
      }),
      this.prisma.brand.count({ where }),
    ]);

    const results: SearchResult[] = brands.map((brand) => ({
      id: brand.brand_id,
      type: "brand" as const,
      title: brand.brand_name,
      description: brand.description,
      image: brand.brand_logo,
      url: `/brands/${brand.brand_id}`,
      score: this.calculateRelevanceScore(
        options.query,
        brand.brand_name,
        brand.description,
      ),
    }));

    return { results, total };
  }

  // 构建产品查询条件
  private buildProductWhereClause(options: SearchOptions): any {
    const where: any = {
      AND: [
        {
          OR: [
            { product_name: { contains: options.query } },
            { product_brief: { contains: options.query } },
            { product_desc: { contains: options.query } },
            { keywords: { contains: options.query } },
          ],
        },
        { product_status: 1 },
        { is_delete: 0 },
        { check_status: 1 },
      ],
    };

    if (options.filters) {
      if (options.filters.priceRange) {
        where.AND.push({
          price: {
            gte: options.filters.priceRange.min,
            lte: options.filters.priceRange.max,
          },
        });
      }

      if (options.filters.category && options.filters.category.length > 0) {
        const catIds = options.filters.category
          .map((c) => Number(c))
          .filter((n) => Number.isFinite(n));
        if (catIds.length > 0) {
          where.AND.push({
            category_id: { in: catIds },
          });
        }
      }

      if (options.filters.brand && options.filters.brand.length > 0) {
        where.AND.push({
          brand_id: { in: options.filters.brand },
        });
      }

      if (options.filters.inStock !== undefined) {
        where.AND.push({
          product_stock: options.filters.inStock ? { gt: 0 } : { lte: 0 },
        });
      }

      if (options.filters.hasDiscount !== undefined) {
        if (options.filters.hasDiscount) {
          where.AND.push({
            OR: [
              { is_promote: 1 },
              { is_promote_activity: true },
              { promote_price: { gt: 0 } },
            ],
          });
        } else {
          where.AND.push({
            AND: [
              { is_promote: 0 },
              { is_promote_activity: false },
              { promote_price: { lte: 0 } },
            ],
          });
        }
      }

      if (options.filters.dateRange) {
        where.AND.push({
          add_time: {
            gte: options.filters.dateRange.start,
            lte: options.filters.dateRange.end,
          },
        });
      }
    }

    return where;
  }

  // 计算相关性得分
  private calculateRelevanceScore(
    query: string,
    title: string,
    description?: string,
  ): number {
    const lowerQuery = query.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerDescription = description?.toLowerCase() || "";

    let score = 0;

    // 标题完全匹配
    if (lowerTitle === lowerQuery) {
      score += 100;
    }
    // 标题开头匹配
    else if (lowerTitle.startsWith(lowerQuery)) {
      score += 80;
    }
    // 标题包含匹配
    else if (lowerTitle.includes(lowerQuery)) {
      score += 60;
    }

    // 描述包含匹配
    if (lowerDescription.includes(lowerQuery)) {
      score += 40;
    }

    // 单词匹配
    const queryWords = lowerQuery.split(" ");
    const titleWords = lowerTitle.split(" ");
    const descriptionWords = lowerDescription.split(" ");

    queryWords.forEach((queryWord) => {
      if (titleWords.includes(queryWord)) {
        score += 20;
      }
      if (descriptionWords.includes(queryWord)) {
        score += 10;
      }
    });

    return Math.min(score, 100);
  }

  // 排序结果
  private sortResults(
    results: SearchResult[],
    sortBy?: string,
    sortOrder?: string,
  ): SearchResult[] {
    const sorted = [...results];

    switch (sortBy) {
      case "date":
        sorted.sort((a, b) => {
          // 这里需要根据实际数据添加日期字段
          return sortOrder === "desc" ? 0 : 0;
        });
        break;
      case "price":
        sorted.sort((a, b) => {
          const priceA = a.metadata?.price || 0;
          const priceB = b.metadata?.price || 0;
          return sortOrder === "desc" ? priceB - priceA : priceA - priceB;
        });
        break;
      case "popularity":
        sorted.sort((a, b) => {
          // 这里需要根据实际数据添加销量字段
          return sortOrder === "desc" ? 0 : 0;
        });
        break;
      case "relevance":
      default:
        sorted.sort((a, b) => {
          return sortOrder === "desc" ? b.score - a.score : a.score - b.score;
        });
        break;
    }

    return sorted;
  }

  // 获取搜索建议
  async getSuggestions(query: string): Promise<string[]> {
    const cacheKey = `search_suggestions:${query}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const suggestions = new Set<string>();

        // 从产品名称获取建议
        const products = await this.prisma.product.findMany({
          where: {
            OR: [
              { product_name: { contains: query } },
              { keywords: { contains: query } },
            ],
            product_status: 1,
            is_delete: 0,
            check_status: 1,
          },
          select: { product_name: true },
          take: 10,
        });

        products.forEach((product) => {
          suggestions.add(product.product_name);
        });

        // 从分类获取建议
        const categories = await this.prisma.category.findMany({
          where: {
            category_name: { contains: query },
          },
          select: { category_name: true },
          take: 5,
        });

        categories.forEach((category) => {
          suggestions.add(category.category_name);
        });

        // 从品牌获取建议
        const brands = await this.prisma.brand.findMany({
          where: {
            brand_name: { contains: query },
          },
          select: { brand_name: true },
          take: 5,
        });

        brands.forEach((brand) => {
          suggestions.add(brand.brand_name);
        });

        return Array.from(suggestions).slice(0, 10);
      },
      { ttl: 1800 },
    ); // 缓存30分钟
  }

  // 搜索历史记录
  async saveSearchHistory(
    userId: number,
    query: string,
    resultsCount: number,
  ): Promise<void> {
    await this.prisma.searchHistory.create({
      data: {
        user_id: userId,
        query,
        results_count: resultsCount,
      },
    });

    // 限制历史记录数量
    const historyCount = await this.prisma.searchHistory.count({
      where: { user_id: userId },
    });

    if (historyCount > 50) {
      const oldestRecords = await this.prisma.searchHistory.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "asc" },
        take: historyCount - 50,
      });

      await this.prisma.searchHistory.deleteMany({
        where: {
          id: { in: oldestRecords.map((r) => r.id) },
        },
      });
    }
  }

  async getSearchHistory(
    userId: number,
    limit = 10,
  ): Promise<
    Array<{
      query: string;
      createdAt: Date;
      resultsCount: number;
    }>
  > {
    const history = await this.prisma.searchHistory.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return history.map((h) => ({
      query: h.query,
      createdAt: h.created_at,
      resultsCount: h.results_count,
    }));
  }

  async deleteSearchHistory(userId: number, query?: string): Promise<void> {
    if (query) {
      await this.prisma.searchHistory.deleteMany({
        where: {
          user_id: userId,
          query,
        },
      });
    } else {
      await this.prisma.searchHistory.deleteMany({
        where: { user_id: userId },
      });
    }
  }

  // 热门搜索
  async getPopularSearches(limit = 10): Promise<
    Array<{
      query: string;
      count: number;
    }>
  > {
    const cacheKey = "popular_searches";

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const popularSearches = await this.prisma.searchHistory.groupBy({
          by: ["query"],
          _count: { query: true },
          orderBy: {
            _count: {
              query: "desc",
            },
          },
          take: limit,
          where: {
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
            },
          },
        });

        return popularSearches.map((item) => ({
          query: item.query,
          count: item._count.query,
        }));
      },
      { ttl: 3600 },
    ); // 缓存1小时
  }

  // 索引管理
  async rebuildIndex(
    type: "product" | "user" | "category" | "brand" | "all",
  ): Promise<void> {
    // 这里可以实现Elasticsearch或其他搜索引擎的索引重建逻辑
    this.logger.debug(`Rebuilding search index for: ${type}`);
  }

  // 清除搜索缓存
  async clearCache(): Promise<void> {
    await this.redisService.clearPattern("search:*");
    await this.redisService.clearPattern("search_suggestions:*");
    await this.redisService.del("popular_searches");
  }
}
