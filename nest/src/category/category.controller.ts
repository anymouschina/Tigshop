// @ts-nocheck
import { Controller, Get, Post, Body, Query, Param, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CategoryService, CategoryTreeNode } from "./category.service";
import { Public } from "../auth/decorators/public.decorator";
import { Request } from "express";
import { ShopProductCategoryService } from "src/merchant/shop-product-category/shop-product-category.service";

@ApiTags("Product Category")
@Controller("api")
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly shopCatService: ShopProductCategoryService,
  ) {}

  /**
   * 获取当前分类的父级分类 - 对齐PHP版本 category/Category/parentTree
   */
  @Get("category/category/parentTree")
  @Public()
  @ApiOperation({ summary: "获取当前分类的父级分类" })
  async parentTree(@Query("id") id: string) {
    const categoryId = Number(id) || 0;
    const data = await this.categoryService.getParentCategoryTree(categoryId);
    const mapped = (data || []).map((item: any) => ({
      categoryId: item.category_id,
      parentId: item.parent_id,
      categoryName: item.category_name,
      catList: Array.isArray(item.cat_list)
        ? item.cat_list.map((c: any) => ({
            categoryId: c.category_id,
            parentId: c.parent_id,
            categoryName: c.category_name,
          }))
        : [],
    }));
    return { code: 0, message: "success", data: mapped };
  }

  /**
   * 根据上级获得指定分类 - 对齐PHP版本 category/Category/list
   */
  @Get("category/category/list")
  @Public()
  @ApiOperation({ summary: "根据上级获得指定分类" })
  async list(@Query("id") id: string, @Query("shopId") shopIdQ: string, @Req() req: Request): Promise<any> {
    const categoryId = Number(id) || 0;
    // Extract shopId from query or header (header: X-Shop-Id), allow 0
    const headerValRaw = (req.headers['x-shop-id'] ?? req.headers['X-Shop-Id' as any]) as any;
    const headerVal = headerValRaw !== undefined ? Number(headerValRaw) : undefined;
    const resolvedShopId = shopIdQ !== undefined && shopIdQ !== null && shopIdQ !== '' ? Number(shopIdQ) : headerVal;

    // Helper to camel-case
    const toCamel = (nodes: CategoryTreeNode[]): any[] =>
      (nodes || []).map((n) => ({
        categoryId: n.category_id,
        categoryName: n.category_name,
        parentId: n.parent_id,
        categoryPic: n.category_pic || "",
        sortOrder: n.sort_order ?? 0,
        ...(n.children && n.children.length ? { children: toCamel(n.children) } : {}),
      }));

    // If no shopId provided, fallback to original global behaviour
    if (resolvedShopId === undefined || isNaN(resolvedShopId)) {
      const data = await this.categoryService.getCategoryList(categoryId);
      return toCamel(data);
    }

    // Fetch full shop tree first
    const shopTree = await this.shopCatService.getAll(resolvedShopId);
    const mapShopNode = (n: any): CategoryTreeNode => ({
      category_id: n.category_id,
      parent_id: n.parent_id,
      category_name: n.category_name,
      category_pic: n.category_pic || '',
      sort_order: n.sort_order ?? 0,
      children: (n.children || []).map(mapShopNode),
    });
    const shopTreeMapped: CategoryTreeNode[] = shopTree.map(mapShopNode);

    // Slice by parent if categoryId > 0
    let targetList: CategoryTreeNode[];
    if (categoryId === 0) {
      // roots
      targetList = shopTreeMapped.filter((n) => (n.parent_id ?? 0) === 0);
    } else {
      // Need to locate the node in the whole tree, not only root level.
      const findNode = (nodes: CategoryTreeNode[], id: number): CategoryTreeNode | null => {
        for (const n of nodes) {
          if (n.category_id === id) return n;
          if (n.children && n.children.length) {
            const found = findNode(n.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const node = findNode(shopTreeMapped, categoryId);
      targetList = node ? (node.children || []) : [];
    }

    let source: 'shop' | 'global' = 'shop';
    let fallback = false;

    if (!targetList.length) {
      // Fallback to global
      const data = await this.categoryService.getCategoryList(categoryId);
      targetList = data;
      source = 'global';
      fallback = true;
    }

    return {
      source,
      fallback,
      shopId: resolvedShopId,
      list: toCamel(targetList),
    };
  }

  /**
   * 所有分类 - 对齐PHP版本 category/Category/all
   */
  @Get("category/category/all")
  @Public()
  @ApiOperation({ summary: "获取所有分类" })
  async all(@Query("shopId") shopIdQ: string, @Req() req: Request): Promise<any> {
    const headerValRaw = (req.headers['x-shop-id'] ?? req.headers['X-Shop-Id' as any]) as any;
    const headerVal = headerValRaw !== undefined ? Number(headerValRaw) : undefined;
    const resolvedShopId = shopIdQ !== undefined && shopIdQ !== null && shopIdQ !== '' ? Number(shopIdQ) : headerVal;

    const toCamel = (nodes: CategoryTreeNode[]): any[] =>
      (nodes || []).map((n) => ({
        categoryId: n.category_id,
        categoryName: n.category_name,
        parentId: n.parent_id,
        categoryPic: n.category_pic || "",
        sortOrder: n.sort_order ?? 0,
        ...(n.children && n.children.length ? { children: toCamel(n.children) } : {}),
      }));

    if (resolvedShopId === undefined || isNaN(resolvedShopId)) {
      const data = await this.categoryService.getAllCategories();
      return { source: 'global', fallback: false, list: toCamel(data) };
    }

    const shopTree = await this.shopCatService.getAll(resolvedShopId);
    const mapShopNode = (n: any): CategoryTreeNode => ({
      category_id: n.category_id,
      parent_id: n.parent_id,
      category_name: n.category_name,
      category_pic: n.category_pic || '',
      sort_order: n.sort_order ?? 0,
      children: (n.children || []).map(mapShopNode),
    });
    let tree = shopTree.map(mapShopNode);
    let source: 'shop' | 'global' = 'shop';
    let fallback = false;
    if (!tree.length) {
      const data = await this.categoryService.getAllCategories();
      tree = data;
      source = 'global';
      fallback = true;
    }
    return { source, fallback, shopId: resolvedShopId, list: toCamel(tree) };
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
    return this.categoryService.getRelateInfo(this.normalizeRelateQuery(query));
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
    return this.categoryService.getRelateCategory(
      this.normalizeRelateQuery(query),
    );
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
    return this.categoryService.getRelateBrand(
      this.normalizeRelateQuery(query),
    );
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
    return this.categoryService.getRelateArticle(
      this.normalizeRelateQuery(query),
    );
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
    return this.categoryService.getRelateRank(this.normalizeRelateQuery(query));
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
    return this.categoryService.getRelateLookAlso(
      this.normalizeRelateQuery(query),
    );
  }

  /**
   * 热门分类 - 对齐PHP版本 category/Category/hot
   */
  @Get("category/category/hot")
  @Public()
  @ApiOperation({ summary: "获取热门分类" })
  async hot() {
    const data = await this.categoryService.getHotCategories();
    // 返回完整驼峰字段结构
    return (data || []).map((c) => ({
      categoryId: c.category_id,
      categoryName: c.category_name,
      keywords: c.keywords ?? "",
      categoryDesc: c.category_desc ?? "",
      parentId: c.parent_id,
      sortOrder: c.sort_order,
      measureUnit: c.measure_unit ?? "",
      isShow: c.is_show,
      seoTitle: c.seo_title ?? "",
      shortName: c.short_name ?? "",
      categoryPic: c.category_pic ?? "",
      categoryIco: c.category_ico ?? "",
      isHot: c.is_hot,
      searchKeywords: c.search_keywords ?? "",
    }));
  }

  private normalizeRelateQuery(query: {
    product_id?: number | string;
    size?: number | string;
    rank_num?: number | string;
    intro?: string;
  }) {
    return {
      product_id: Number(query?.product_id) || 0,
      size: Number(query?.size) > 0 ? Number(query.size) : 10,
      rank_num: Number(query?.rank_num) > 0 ? Number(query.rank_num) : 5,
      intro: query?.intro || "hot",
    };
  }
}
