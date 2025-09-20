// @ts-nocheck
import { Controller, Get, Post, Body, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CategoryService } from "./category.service";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Product Category")
@Controller("api")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * 获取当前分类的父级分类 - 对齐PHP版本 category/Category/parentTree
   */
  @Get("category/category/parentTree")
  @Public()
  @ApiOperation({ summary: "获取当前分类的父级分类" })
  async parentTree(@Query("id") id: string) {
    const categoryId = parseInt(id) || 0;
    return this.categoryService.getParentCategoryTree(categoryId);
  }

  /**
   * 根据上级获得指定分类 - 对齐PHP版本 category/Category/list
   */
  @Get("category/category/list")
  @Public()
  @ApiOperation({ summary: "根据上级获得指定分类" })
  async list(@Query("id") id: string) {
    const categoryId = parseInt(id) || 0;
    const list = await this.categoryService.getCategoryList(categoryId);
    return list.length === 1 && list[0].category_id ? [] : list;
  }

  /**
   * 所有分类 - 对齐PHP版本 category/Category/all
   */
  @Get("category/category/all")
  @Public()
  @ApiOperation({ summary: "获取所有分类" })
  async all() {
    return this.categoryService.getAllCategories();
  }

  /**
   * 商品相关分类信息 - 对齐PHP版本 category/Category/relateInfo
   */
  @Get("category/category/relateInfo")
  @Public()
  @ApiOperation({ summary: "获取商品相关分类信息" })
  async relateInfo(
    @Query()
    query: {
      product_id?: number;
      size?: number;
      rank_num?: number;
      intro?: string;
    },
  ) {
    return this.categoryService.getRelateInfo(query);
  }

  /**
   * 相关分类 - 对齐PHP版本 category/Category/getRelateCategory
   */
  @Get("category/category/getRelateCategory")
  @Public()
  @ApiOperation({ summary: "获取相关分类" })
  async getRelateCategory(
    @Query()
    query: {
      product_id?: number;
      size?: number;
      rank_num?: number;
      intro?: string;
    },
  ) {
    return this.categoryService.getRelateCategory(query);
  }

  /**
   * 相关品牌 - 对齐PHP版本 category/Category/getRelateBrand
   */
  @Get("category/category/getRelateBrand")
  @Public()
  @ApiOperation({ summary: "获取相关品牌" })
  async getRelateBrand(
    @Query()
    query: {
      product_id?: number;
      size?: number;
      rank_num?: number;
      intro?: string;
    },
  ) {
    return this.categoryService.getRelateBrand(query);
  }

  /**
   * 相关文章 - 对齐PHP版本 category/Category/getRelateArticle
   */
  @Get("category/category/getRelateArticle")
  @Public()
  @ApiOperation({ summary: "获取相关文章" })
  async getRelateArticle(
    @Query()
    query: {
      product_id?: number;
      size?: number;
      rank_num?: number;
      intro?: string;
    },
  ) {
    return this.categoryService.getRelateArticle(query);
  }

  /**
   * 相关排行 - 对齐PHP版本 category/Category/getRelateRank
   */
  @Get("category/category/getRelateRank")
  @Public()
  @ApiOperation({ summary: "获取相关排行" })
  async getRelateRank(
    @Query()
    query: {
      product_id?: number;
      size?: number;
      rank_num?: number;
      intro?: string;
    },
  ) {
    return this.categoryService.getRelateRank(query);
  }

  /**
   * 相关看了还看 - 对齐PHP版本 category/Category/getRelateLookAlso
   */
  @Get("category/category/getRelateLookAlso")
  @Public()
  @ApiOperation({ summary: "获取相关看了还看" })
  async getRelateLookAlso(
    @Query()
    query: {
      product_id?: number;
      size?: number;
      rank_num?: number;
      intro?: string;
    },
  ) {
    return this.categoryService.getRelateLookAlso(query);
  }

  /**
   * 热门分类 - 对齐PHP版本 category/Category/hot
   */
  @Get("category/category/hot")
  @Public()
  @ApiOperation({ summary: "获取热门分类" })
  async hot() {
    return this.categoryService.getHotCategories();
  }
}
