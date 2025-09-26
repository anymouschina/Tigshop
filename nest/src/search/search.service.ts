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
        include: {
          category: true,
          brand: true,
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const results: SearchResult[] = products.map((product) => ({
      id: product.product_id,
      type: "product" as const,
      title: product.product_name,
      description: product.description,
      image: product.image,
      url: `/products/${product.product_id}`,
      score: this.calculateRelevanceScore(
        options.query,
        product.product_name,
        product.description,
      ),
      metadata: {
        price: product.price,
        originalPrice: product.original_price,
        stock: product.stock,
        isOnSale: product.is_on_sale,
        category: product.category?.category_name,
        brand: product.brand?.brand_name,
      },
    }));

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
      is_enabled: true,
    };

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
      description: category.description,
      image: category.image,
      url: `/categories/${category.category_id}`,
      score: this.calculateRelevanceScore(
        options.query,
        category.category_name,
        category.description,
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
      is_enabled: true,
    };

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
      image: brand.logo,
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
            { description: { contains: options.query } },
            { keywords: { contains: options.query } },
          ],
        },
        { is_enabled: true },
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
        where.AND.push({
          category_id: { in: options.filters.category },
        });
      }

      if (options.filters.brand && options.filters.brand.length > 0) {
        where.AND.push({
          brand_id: { in: options.filters.brand },
        });
      }

      if (options.filters.inStock !== undefined) {
        where.AND.push({
          stock: options.filters.inStock ? { gt: 0 } : { lte: 0 },
        });
      }

      if (options.filters.hasDiscount !== undefined) {
        where.AND.push({
          is_on_sale: options.filters.hasDiscount,
        });
      }

      if (options.filters.dateRange) {
        where.AND.push({
          created_at: {
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
            is_enabled: true,
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
            is_enabled: true,
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
            is_enabled: true,
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
