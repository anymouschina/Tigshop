// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Delete,
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
@Controller("api/search/search")
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * 获取搜索过滤器 - 对齐PHP版本 search/search/getFilter
   */
  @Post("getFilter")
  @Public()
  @ApiOperation({ summary: "获取搜索过滤器" })
  async getSearchFilter(
    @Body()
    query: {
      page?: number;
      size?: number;
      order?: string;
      cat?: number;
      brand?: number;
      couponId?: number;
      pageType?: string;
      keyword?: string;
    },
  ) {
    const catNum = query.cat !== undefined && query.cat !== null ? Number(query.cat) : undefined;
    const brandNum = query.brand !== undefined && query.brand !== null ? Number(query.brand) : undefined;

    const { filter, total } = await this.searchService.getFilterData({
      keyword: query.keyword || "",
      cat: catNum,
      brand: brandNum,
      couponId: query.couponId ? Number(query.couponId) : 0,
      pageType: query.pageType || "search",
      shopCategory: null,
      attrs: [],
    });

    // 将已选分类展示为分类名称（字符串），对齐目标返回
    let selectedCategoryName = "" as string;
    if (catNum) {
      const cat = await this.searchService["prisma"].category.findFirst({
        where: { category_id: catNum },
        select: { category_name: true },
      });
      selectedCategoryName = cat?.category_name || "";
    }

    const filterSelected = {
      category: selectedCategoryName,
      brand: brandNum ?? "",
      keyword: query.keyword || "",
      intro: "",
      shopCategory: null,
      attrs: [],
    };

    return {
      code: 0,
      message: "success",
      data: {
        filter,
        filterSelected,
        total,
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
    @Query()
    query: {
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

    const pageNum = Number(page) || 1;
    const sizeNum = Number(size) || 10;
    const catNum = cat !== undefined && cat !== null ? Number(cat) : undefined;
    const couponIdNum = Number(couponId) || 0;

    // 构建搜索选项
    const searchOptions = {
      query: keyword,
      type: "product",
      page: pageNum,
      limit: sizeNum,
      sortBy: order === "asc" ? "price" : "popularity",
      sortOrder: order,
      filters: {
        category: catNum ? [catNum] : [],
        hasDiscount: couponIdNum > 0,
      },
    };

    // 调用搜索服务
    const searchResults = await this.searchService.search(searchOptions);

    // 映射到对齐PHP的返回结构
    const records = searchResults.results.map((result) => {
      const m = result.metadata || {};
      const priceStr = m.price != null ? String(m.price) : "0.00";
      const marketPriceStr = m.originalPrice != null ? String(m.originalPrice) : "0.00";

      return {
        productId: result.id,
        picThumb: m.picThumb || m.picUrl || result.image || "",
        picUrl: m.picUrl || result.image || "",
        productName: result.title,
        virtualSales: m.virtualSales ?? 0,
        checkStatus: m.checkStatus ?? 0,
        shopId: m.shopId ?? 0,
        suppliersId: m.suppliersId ?? null,
        productType: m.productType ?? 1,
        productSn: m.productSn || "",
        productPrice: priceStr,
        marketPrice: marketPriceStr,
        productStatus: m.productStatus ?? 0,
        isBest: m.isBest ?? 0,
        isNew: m.isNew ?? 0,
        isHot: m.isHot ?? 0,
        productStock: m.stock ?? 0,
        sortOrder: m.sortOrder ?? 100,
        productBrief: m.productBrief || "",
        skuPrice: null,
        seckillPrice: null,
        productSku: [],
        shop: null,
        price: priceStr,
        isSeckill: 0,
        seckillEndTime: "",
        seckillStock: m.stock ?? 0,
      };
    });

    return {
      code: 0,
      message: "success",
      data: {
        records,
        total: searchResults.total,
      },
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "获取搜索历史" })
  async getSearchHistory(@Request() req, @Query("limit") limit?: number) {
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "删除搜索历史" })
  async deleteSearchHistory(@Request() req, @Query("query") query?: string) {
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
  @Public()
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
  @Public()
  @ApiOperation({ summary: "清除搜索缓存" })
  async clearCache() {
    await this.searchService.clearCache();

    return {
      success: true,
      message: "搜索缓存清除成功",
    };
  }
}
