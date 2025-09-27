// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Search Management")
@Controller("search/search")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * 获取搜索过滤器 - 对齐PHP版本 search/search/getFilter
   */
  @Get("getFilter")
  @Public()
  @ApiOperation({ summary: "获取搜索过滤器" })
  async getSearchFilter(
    @Query() query: {
      page?: number;
      size?: number;
      order?: string;
      cat?: number;
      couponId?: number;
      pageType?: string;
    },
  ) {
    const {
      page = 1,
      size = 10,
      order = "asc",
      cat,
      couponId = 0,
      pageType = "search",
    } = query;

    // 构建过滤器选项
    const filters = {
      // 分类过滤器
      categories: cat
        ? [
            {
              id: cat,
              name: `分类 ${cat}`,
              selected: true,
            },
          ]
        : [
            { id: 1, name: "电子产品", selected: false },
            { id: 2, name: "服装", selected: false },
            { id: 3, name: "家居", selected: false },
            { id: 36, name: "测试分类", selected: false },
          ],

      // 价格区间过滤器
      priceRanges: [
        { min: 0, max: 100, label: "0-100元", selected: false },
        { min: 100, max: 500, label: "100-500元", selected: false },
        { min: 500, max: 1000, label: "500-1000元", selected: false },
        { min: 1000, max: 999999, label: "1000元以上", selected: false },
      ],

      // 品牌过滤器
      brands: [
        { id: 1, name: "苹果", selected: false },
        { id: 2, name: "三星", selected: false },
        { id: 3, name: "华为", selected: false },
      ],

      // 排序选项
      sortOptions: [
        { value: "relevance", label: "相关性", selected: order === "relevance" },
        { value: "date", label: "发布时间", selected: order === "date" },
        { value: "price", label: "价格", selected: order === "price" },
        { value: "popularity", label: "人气", selected: order === "popularity" },
      ],

      // 优惠券过滤器
      coupons: couponId > 0
        ? [
            {
              id: couponId,
              name: `优惠券 ${couponId}`,
              selected: true,
            },
          ]
        : [
            { id: 1, name: "新用户优惠券", selected: false },
            { id: 2, name: "满减券", selected: false },
          ],

      // 库存状态
      stockOptions: [
        { value: "all", label: "全部", selected: true },
        { value: "inStock", label: "仅显示有货", selected: false },
        { value: "discount", label: "仅显示特惠", selected: false },
      ],

      // 评分过滤器
      ratingOptions: [
        { value: 4, label: "4星及以上", selected: false },
        { value: 3, label: "3星及以上", selected: false },
      ],

      // 页面类型
      pageType,
    };

    return {
      filters,
      pagination: {
        page,
        size,
        total: 100, // 模拟总数
        totalPages: Math.ceil(100 / size),
      },
    };
  }

  /**
   * 获取搜索产品 - 对齐PHP版本 search/search/getProduct
   */
  @Get("getProduct")
  @Public()
  @ApiOperation({ summary: "获取搜索产品" })
  async getSearchProduct(
    @Query() query: {
      page?: number;
      size?: number;
      order?: string;
      cat?: number;
      couponId?: number;
      pageType?: string;
      keyword?: string;
    },
  ) {
    const {
      page = 1,
      size = 10,
      order = "asc",
      cat,
      couponId = 0,
      pageType = "search",
      keyword = "",
    } = query;

    // 构建搜索选项
    const searchOptions = {
      query: keyword,
      type: "product",
      page,
      limit: size,
      sortBy: order === "asc" ? "price" : "popularity",
      sortOrder: order,
      filters: {
        category: cat ? [cat] : [],
        hasDiscount: couponId > 0,
      },
    };

    // 调用搜索服务
    const searchResults = await this.searchService.search(searchOptions);

    // 格式化产品数据
    const products = searchResults.results.map((result) => ({
      productId: result.id,
      productName: result.title,
      productImage: result.image,
      productPrice: result.metadata?.price || 0,
      originalPrice: result.metadata?.originalPrice || 0,
      productStock: result.metadata?.stock || 0,
      isOnSale: result.metadata?.isOnSale || false,
      category: result.metadata?.category,
      brand: result.metadata?.brand,
      discount: result.metadata?.hasDiscount
        ? Math.round(
            ((result.metadata?.originalPrice - result.metadata?.price) /
              result.metadata?.originalPrice) *
              100,
          )
        : 0,
      score: result.score,
    }));

    return {
      products,
      pagination: {
        page,
        size,
        total: searchResults.total,
        totalPages: Math.ceil(searchResults.total / size),
        hasMore: searchResults.hasMore,
      },
      filters: {
        category: cat,
        couponId,
        order,
        pageType,
      },
      suggestions: searchResults.suggestions,
    };
  }

  /**
   * 搜索建议 - 对齐PHP版本 search/search/suggestions
   */
  @Get("suggestions")
  @Public()
  @ApiOperation({ summary: "获取搜索建议" })
  async getSearchSuggestions(@Query("q") query: string) {
    const suggestions = await this.searchService.getSuggestions(query);

    return {
      query,
      suggestions: suggestions.map((suggestion, index) => ({
        id: index + 1,
        text: suggestion,
        type: "product",
        count: Math.floor(Math.random() * 100) + 1, // 模拟计数
      })),
    };
  }

  /**
   * 热门搜索 - 对齐PHP版本 search/search/popular
   */
  @Get("popular")
  @Public()
  @ApiOperation({ summary: "获取热门搜索" })
  async getPopularSearches(@Query("limit") limit?: number) {
    const popularSearches = await this.searchService.getPopularSearches(
      limit ? Number(limit) : 10,
    );

    return {
      popularSearches: popularSearches.map((item, index) => ({
        id: index + 1,
        keyword: item.query,
        count: item.count,
        trend: Math.random() > 0.5 ? "up" : "down", // 模拟趋势
      })),
    };
  }

  /**
   * 保存搜索历史
   */
  @Post("history")
  @ApiOperation({ summary: "保存搜索历史" })
  async saveSearchHistory(
    @Request() req,
    @Body() data: { query: string; resultsCount: number },
  ) {
    await this.searchService.saveSearchHistory(
      req.user.userId,
      data.query,
      data.resultsCount,
    );

    return {
      success: true,
      message: "搜索历史保存成功",
    };
  }

  /**
   * 获取搜索历史
   */
  @Get("history")
  @ApiOperation({ summary: "获取搜索历史" })
  async getSearchHistory(
    @Request() req,
    @Query("limit") limit?: number,
  ) {
    const history = await this.searchService.getSearchHistory(
      req.user.userId,
      limit ? Number(limit) : 10,
    );

    return {
      history: history.map((item, index) => ({
        id: index + 1,
        query: item.query,
        createdAt: item.createdAt,
        resultsCount: item.resultsCount,
      })),
    };
  }

  /**
   * 删除搜索历史
   */
  @Delete("history")
  @ApiOperation({ summary: "删除搜索历史" })
  async deleteSearchHistory(
    @Request() req,
    @Query("query") query?: string,
  ) {
    await this.searchService.deleteSearchHistory(req.user.userId, query);

    return {
      success: true,
      message: query ? "指定搜索历史删除成功" : "所有搜索历史删除成功",
    };
  }

  /**
   * 重建搜索索引
   */
  @Post("reindex")
  @ApiOperation({ summary: "重建搜索索引" })
  async rebuildIndex(@Body() data: { type?: string }) {
    const type = data.type || "all";
    await this.searchService.rebuildIndex(type as any);

    return {
      success: true,
      message: `搜索索引重建成功: ${type}`,
    };
  }

  /**
   * 清除搜索缓存
   */
  @Post("clearCache")
  @ApiOperation({ summary: "清除搜索缓存" })
  async clearCache() {
    await this.searchService.clearCache();

    return {
      success: true,
      message: "搜索缓存清除成功",
    };
  }
}