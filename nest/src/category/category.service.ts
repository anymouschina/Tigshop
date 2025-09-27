// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type CategoryRelateQuery = {
  product_id?: number;
  size?: number;
  rank_num?: number;
  intro?: string;
};

export type CategoryTreeNode = {
  category_id: number;
  parent_id: number;
  category_name: string;
  category_pic?: string;
  children?: CategoryTreeNode[];
};

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取当前分类的父级分类
   */
  async getParentCategoryTree(categoryId: number) {
    if (!categoryId) {
      return [];
    }

    const nodes: {
      category_id: number;
      parent_id: number;
      category_name: string;
    }[] = [];
    const visited = new Set<number>();
    let currentId = categoryId;

    while (currentId > 0 && !visited.has(currentId)) {
      visited.add(currentId);

      const category = await this.prisma.category.findFirst({
        where: { category_id: currentId },
        select: {
          category_id: true,
          parent_id: true,
          category_name: true,
        },
      });

      if (!category) {
        break;
      }

      nodes.push({
        category_id: category.category_id,
        parent_id: category.parent_id ?? 0,
        category_name: this.lang(category.category_name),
      });

      currentId = category.parent_id ?? 0;

      if (nodes.length > 5) {
        break;
      }
    }

    nodes.reverse();

    const result = await Promise.all(
      nodes.map(async (item) => {
        const siblings = await this.prisma.category.findMany({
          where: {
            parent_id: item.parent_id,
            is_show: 1,
          },
          orderBy: [
            { sort_order: "asc" },
            { category_id: "asc" },
          ],
          select: {
            category_id: true,
            parent_id: true,
            category_name: true,
          },
        });

        return {
          ...item,
          cat_list: siblings.map((sibling) => ({
            category_id: sibling.category_id,
            parent_id: sibling.parent_id ?? 0,
            category_name: this.lang(sibling.category_name),
          })),
        };
      }),
    );

    return result;
  }

  /**
   * 根据上级获得指定分类
   */
  async getCategoryList(parentId: number) {
    const list = await this.catList(parentId);
    return Array.isArray(list) && list.length ? list : [];
  }

  /**
   * 所有分类
   */
  async getAllCategories() {
    return this.catList(0);
  }

  /**
   * 商品相关分类信息
   */
  async getRelateInfo(query: CategoryRelateQuery) {
    const filter = this.normalizeRelateQuery(query);

    const product = await this.prisma.product.findFirst({
      where: { product_id: filter.product_id },
      select: { category_id: true },
    });

    if (!product) {
      return {
        cate_info: [],
        brand_info: [],
        cate_ranke: [],
        article_list: [],
        look_also: [],
        filter,
      };
    }

    const [cateInfo, brandInfo, cateRank, articleList, lookAlso] =
      await Promise.all([
        this.getRelatedCategoryList(product.category_id, filter.size),
        this.getOtherBrand(product.category_id, filter.size),
        this.getCategoryRank(product.category_id, filter.rank_num, filter.product_id),
        this.getArticleList(filter.product_id, filter.size),
        this.getLookAlso(product.category_id, filter.size, filter.intro, filter.product_id),
      ]);

    return {
      cate_info: cateInfo,
      brand_info: brandInfo,
      cate_ranke: cateRank,
      article_list: articleList,
      look_also: lookAlso,
      filter,
    };
  }

  /**
   * 相关分类
   */
  async getRelateCategory(query: CategoryRelateQuery) {
    const filter = this.normalizeRelateQuery(query);

    const product = await this.prisma.product.findFirst({
      where: { product_id: filter.product_id },
      select: { category_id: true },
    });

    if (!product) {
      return { cate_info: [] };
    }

    const cateInfo = await this.getRelatedCategoryList(
      product.category_id,
      filter.size,
    );

    return { cate_info: cateInfo };
  }

  /**
   * 相关品牌
   */
  async getRelateBrand(query: CategoryRelateQuery) {
    const filter = this.normalizeRelateQuery(query);

    const product = await this.prisma.product.findFirst({
      where: { product_id: filter.product_id },
      select: { category_id: true },
    });

    if (!product) {
      return [];
    }

    return this.getOtherBrand(product.category_id, filter.size);
  }

  /**
   * 相关文章
   */
  async getRelateArticle(query: CategoryRelateQuery) {
    const filter = this.normalizeRelateQuery(query);
    return this.getArticleList(filter.product_id, filter.size);
  }

  /**
   * 相关排行
   */
  async getRelateRank(query: CategoryRelateQuery) {
    const filter = this.normalizeRelateQuery(query);

    const product = await this.prisma.product.findFirst({
      where: { product_id: filter.product_id },
      select: { category_id: true },
    });

    if (!product) {
      return { price: [], brand: [], cate: [] };
    }

    return this.getCategoryRank(
      product.category_id,
      filter.rank_num,
      filter.product_id,
    );
  }

  /**
   * 相关看了还看
   */
  async getRelateLookAlso(query: CategoryRelateQuery) {
    const filter = this.normalizeRelateQuery(query);

    const product = await this.prisma.product.findFirst({
      where: { product_id: filter.product_id },
      select: { category_id: true },
    });

    if (!product) {
      return [];
    }

    return this.getLookAlso(
      product.category_id,
      filter.size,
      filter.intro,
      filter.product_id,
    );
  }

  /**
   * 热门分类
   */
  async getHotCategories() {
    const categories = await this.prisma.category.findMany({
      where: {
        is_show: 1,
        is_hot: 1,
      },
      orderBy: [{ sort_order: "desc" }, { category_id: "asc" }],
      take: 20,
      select: {
        category_id: true,
        category_name: true,
        parent_id: true,
        category_pic: true,
        sort_order: true,
      },
    });

    return categories.map((category) => ({
      ...category,
      category_name: this.lang(category.category_name),
    }));
  }

  private normalizeRelateQuery(query: CategoryRelateQuery) {
    return {
      product_id: Number(query?.product_id) || 0,
      size: Number(query?.size) > 0 ? Number(query.size) : 10,
      rank_num: Number(query?.rank_num) > 0 ? Number(query.rank_num) : 5,
      intro: query?.intro || "hot",
    };
  }

  private async catList(categoryId = 0): Promise<CategoryTreeNode[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        is_show: 1,
      },
      orderBy: [
        { parent_id: "asc" },
        { sort_order: "asc" },
        { category_id: "asc" },
      ],
      select: {
        category_id: true,
        category_name: true,
        parent_id: true,
        category_pic: true,
      },
    });

    const grouped = new Map<number, CategoryTreeNode[]>();
    categories.forEach((item) => {
      const node: CategoryTreeNode = {
        category_id: item.category_id,
        parent_id: item.parent_id ?? 0,
        category_name: this.lang(item.category_name),
        category_pic: item.category_pic || "",
      };

      if (!grouped.has(node.parent_id)) {
        grouped.set(node.parent_id, []);
      }
      grouped.get(node.parent_id)?.push(node);
    });

    const buildTree = (parentId: number): CategoryTreeNode[] => {
      const children = grouped.get(parentId) || [];
      return children.map((child) => ({
        ...child,
        children: buildTree(child.category_id),
      }));
    };

    return buildTree(categoryId);
  }

  private async getRelatedCategoryList(categoryId: number, size: number) {
    const current = await this.prisma.category.findFirst({
      where: { category_id: categoryId },
      select: { parent_id: true },
    });

    if (!current) {
      return [];
    }

    const related = await this.prisma.category.findMany({
      where: {
        parent_id: current.parent_id ?? 0,
        is_show: 1,
        category_id: { not: categoryId },
      },
      orderBy: [{ sort_order: "asc" }, { category_id: "asc" }],
      take: size,
      select: {
        category_id: true,
        category_name: true,
        parent_id: true,
        category_pic: true,
      },
    });

    return related.map((item) => ({
      ...item,
      category_name: this.lang(item.category_name),
    }));
  }

  private async getOtherBrand(categoryId: number, size: number) {
    const categoryIds = await this.getChilderIds(categoryId);

    if (!categoryIds.length) {
      return [];
    }

    const productBrands = await this.prisma.product.findMany({
      where: {
        category_id: { in: categoryIds },
        is_delete: 0,
        product_status: 1,
        brand_id: { gt: 0 },
      },
      select: {
        brand_id: true,
      },
      distinct: ["brand_id"],
      take: size * 3,
    });

    const brandIds = productBrands
      .map((item) => item.brand_id)
      .filter((id) => Number(id) > 0);

    if (!brandIds.length) {
      return [];
    }

    const brands = await this.prisma.brand.findMany({
      where: {
        brand_id: { in: brandIds },
        is_show: 1,
        status: true,
      },
      orderBy: [{ sort_order: "asc" }, { brand_id: "asc" }],
      take: size,
      select: {
        brand_id: true,
        brand_name: true,
        brand_logo: true,
        site_url: true,
        first_word: true,
      },
    });

    return brands;
  }

  private async getCategoryRank(
    categoryId: number,
    size: number,
    productId: number,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { product_id: productId },
      select: {
        product_id: true,
        brand_id: true,
        category_id: true,
        market_price: true,
      },
    });

    if (!product) {
      return { price: [], brand: [], cate: [] };
    }

    const categoryIds = await this.getChilderIds(categoryId);

    const baseWhere: Prisma.productWhereInput = {
      product_id: { not: productId },
      is_delete: 0,
      product_status: 1,
    };

    const priceCandidates = await this.prisma.product.findMany({
      where: {
        ...baseWhere,
        category_id: { in: categoryIds.length ? categoryIds : [categoryId] },
      },
      select: this.productSelectFields(),
      take: Math.max(size * 3, 30),
    });

    const priceRank = priceCandidates
      .map((item) => ({
        ...item,
        market_price: Number(item.market_price || 0),
        diff: Math.abs(Number(item.market_price || 0) - Number(product.market_price || 0)),
      }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, size);

    const brandRank = product.brand_id
      ? await this.prisma.product.findMany({
          where: {
            ...baseWhere,
            brand_id: product.brand_id,
          },
          select: this.productSelectFields(),
          orderBy: [{ sort_order: "asc" }, { product_id: "asc" }],
          take: size,
        })
      : [];

    const cateRank = await this.prisma.product.findMany({
      where: {
        ...baseWhere,
        category_id: product.category_id,
      },
      select: this.productSelectFields(),
      orderBy: [{ sort_order: "asc" }, { product_id: "asc" }],
      take: size,
    });

    const mergedIds = [
      ...priceRank.map((p) => p.product_id),
      ...brandRank.map((p) => p.product_id),
      ...cateRank.map((p) => p.product_id),
    ];

    const productsWithPrice = await this.attachProductSkuAndPrice(
      mergedIds,
    );

    const buildList = (list: any[]) =>
      list.map(({ diff, ...item }) => ({
        ...item,
        ...productsWithPrice.get(item.product_id),
      }));

    return {
      price: buildList(priceRank),
      brand: buildList(brandRank),
      cate: buildList(cateRank),
    };
  }

  private async getArticleList(productId: number, size: number) {
    if (!productId) {
      return [];
    }

    const relation = await this.prisma.product_article.findMany({
      where: { goods_id: productId },
      select: { article_id: true },
    });

    const articleIds = relation.map((item) => item.article_id);

    if (!articleIds.length) {
      return [];
    }

    const articles = await this.prisma.article.findMany({
      where: {
        article_id: { in: articleIds },
        is_show: 1,
      },
      orderBy: [{ sort_order: "desc" }, { article_id: "desc" }],
      take: size,
    });

    return articles;
  }

  private async getLookAlso(
    categoryId: number,
    size: number,
    intro: string,
    productId: number,
  ) {
    const categoryIds = await this.catAllChildIds(categoryId);

    if (!categoryIds.length) {
      return [];
    }

    const where: Prisma.productWhereInput = {
      category_id: { in: categoryIds },
      is_delete: 0,
      product_status: 1,
      product_id: { not: productId },
    };

    this.applyIntroFilter(where, intro);

    const products = await this.prisma.product.findMany({
      where,
      select: this.productSelectFields(),
      orderBy: [{ sort_order: "asc" }, { product_id: "asc" }],
      take: size,
    });

    const enriched = await this.attachProductSkuAndPrice(
      products.map((item) => item.product_id),
    );

    return products.map((item) => ({
      ...item,
      ...enriched.get(item.product_id),
    }));
  }

  private productSelectFields() {
    return {
      product_id: true,
      product_name: true,
      product_sn: true,
      market_price: true,
      pic_thumb: true,
      brand_id: true,
      category_id: true,
      sort_order: true,
    } as const;
  }

  private async attachProductSkuAndPrice(productIds: number[]) {
    const uniqueIds = Array.from(new Set(productIds.filter((id) => id)));
    const result = new Map<number, { product_sku: any[]; price: number }>();

    if (!uniqueIds.length) {
      return result;
    }

    const skus = await this.prisma.product_sku.findMany({
      where: { product_id: { in: uniqueIds } },
      orderBy: [{ product_id: "asc" }, { sku_price: "asc" }],
      select: {
        sku_id: true,
        product_id: true,
        sku_price: true,
        sku_sn: true,
        sku_stock: true,
      },
    });

    const grouped = new Map<number, any[]>();
    skus.forEach((sku) => {
      const list = grouped.get(sku.product_id) || [];
      list.push({
        ...sku,
        sku_price: sku.sku_price ? Number(sku.sku_price) : 0,
      });
      grouped.set(sku.product_id, list);
    });

    const products = await this.prisma.product.findMany({
      where: { product_id: { in: uniqueIds } },
      select: {
        product_id: true,
        market_price: true,
      },
    });

    const priceFallback = new Map<number, number>();
    products.forEach((item) => {
      priceFallback.set(item.product_id, Number(item.market_price || 0));
    });

    uniqueIds.forEach((id) => {
      const skuList = grouped.get(id) || [];
      const price = skuList.length
        ? skuList.reduce((min, current) =>
            current.sku_price > 0 && (min === 0 || current.sku_price < min)
              ? current.sku_price
              : min,
          0)
        : priceFallback.get(id) || 0;

      result.set(id, {
        product_sku: skuList,
        price,
      });
    });

    return result;
  }

  private applyIntroFilter(where: Prisma.productWhereInput, intro?: string) {
    if (!intro) {
      return;
    }

    if (intro === "hot") {
      where.is_hot = 1;
    } else if (intro === "new") {
      where.is_new = 1;
    } else if (intro === "best") {
      where.is_best = 1;
    }
  }

  private async catAllChildIds(categoryId: number) {
    const ids = new Set<number>();
    if (categoryId) {
      ids.add(categoryId);
    }

    const children = await this.catList(categoryId);

    const collect = (nodes: CategoryTreeNode[]) => {
      nodes.forEach((node) => {
        ids.add(node.category_id);
        if (node.children && node.children.length) {
          collect(node.children);
        }
      });
    };

    collect(children);

    return Array.from(ids.values());
  }

  private async getChilderIds(categoryId: number) {
    const chain = await this.getCategoryChain(categoryId);
    const topId = chain.length ? chain[chain.length - 1] : categoryId;
    return this.catAllChildIds(topId);
  }

  private async getCategoryChain(categoryId: number) {
    const result: { category_id: number; parent_id: number }[] = [];
    const visited = new Set<number>();
    let current = categoryId;

    while (current > 0 && !visited.has(current)) {
      visited.add(current);
      const category = await this.prisma.category.findFirst({
        where: { category_id: current },
        select: { category_id: true, parent_id: true },
      });
      if (!category) {
        break;
      }
      result.push({
        category_id: category.category_id,
        parent_id: category.parent_id ?? 0,
      });
      current = category.parent_id ?? 0;
      if (result.length > 10) {
        break;
      }
    }

    return result;
  }

  private lang(text: string) {
    return text;
  }
}
