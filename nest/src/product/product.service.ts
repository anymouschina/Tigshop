// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductQueryDto } from "./dto/product-query.dto";
import { Decimal } from "@prisma/client/runtime/library";
import { camelCase } from "src/common/utils/camel-case.util";
import { toMoneyString } from "src/common/utils/format";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建商品
   * @param createProductDto 商品创建数据
   * @returns 创建的商品
   */
  async create(createProductDto: CreateProductDto) {
    // 检查商品名称是否已存在
    const existingProduct = await this.prisma.product.findFirst({
      where: { product_name: createProductDto.name },
    });

    if (existingProduct) {
      throw new BadRequestException("商品名称已存在");
    }

    // 转换DTO为Prisma兼容格式
    const productData: any = {
      name: createProductDto.name,
      subtitle: createProductDto.subtitle,
      description: createProductDto.description,
      price: createProductDto.price,
      marketPrice: createProductDto.marketPrice,
      costPrice: createProductDto.costPrice,
      stock: createProductDto.stock,
      sales: createProductDto.sales,
      categoryId: createProductDto.categoryId,
      brandId: createProductDto.brandId,
      supplierId: createProductDto.supplierId,
      shopId: createProductDto.shopId || 1,
      image: createProductDto.image,
      images: createProductDto.images,
      video: createProductDto.video,
      videoCover: createProductDto.videoCover,
      specType: createProductDto.specType,
      weight: createProductDto.weight,
      volume: createProductDto.volume,
      shippingFee: createProductDto.shippingFee,
      minBuy: createProductDto.minBuy,
      maxBuy: createProductDto.maxBuy,
      keywords: createProductDto.keywords,
      seoTitle: createProductDto.seoTitle,
      seoKeywords: createProductDto.seoKeywords,
      seoDescription: createProductDto.seoDescription,
      sort: createProductDto.sort,
      isBest: createProductDto.isBest,
      isNew: createProductDto.isNew,
      isHot: createProductDto.isHot,
      isRecommend: createProductDto.isRecommend,
    };

    return this.prisma.product.create({
      data: productData,
    });
  }

  /**
   * 获取商品列表
   * @param queryDto 查询参数
   * @returns 商品列表
   */
  async findAll(queryDto: ProductQueryDto) {
    const {
      page = 1,
      size = 15,
      keyword,
      categoryId,
      brandId,
      introType,
      isEnable,
      isBest,
      isNew,
      isHot,
      isRecommend,
      minPrice,
      maxPrice,
      sortField = "productId",
      sortOrder = "desc",
      ids,
      useShopCategory, // 新增：指定 categoryId 代表店铺分类 (shop_category_id)
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {
      product_status: 1,
      is_delete: 0,
    };

    if (queryDto.productId) {
      where.product_id = Number(queryDto.productId);
    }

    if (queryDto.shopId !== undefined && queryDto.shopId > -1) {
      where.shop_id = Number(queryDto.shopId);
    }

    if (keyword) {
      where.OR = [
        { product_name: { contains: keyword } },
        { product_desc: { contains: keyword } },
        { keywords: { contains: keyword } },
      ];
    }

    if (categoryId) {
      if (useShopCategory && (queryDto.shopId !== undefined)) {
        // 店铺分类过滤
        where.shop_category_id = Number(categoryId);
      } else {
        where.category_id = Number(categoryId);
      }
    }

    if (brandId) {
      where.brand_id = Number(brandId);
    }

    if (isEnable !== undefined) {
      // 映射为 product_status: 1/0
      where.product_status = isEnable ? 1 : 0;
    }

    if (isBest !== undefined) {
      where.is_best = isBest ? 1 : 0;
    }

    if (isNew !== undefined) {
      where.is_new = isNew ? 1 : 0;
    }

    if (isHot !== undefined) {
      where.is_hot = isHot ? 1 : 0;
    }

    if (isRecommend !== undefined) {
      where.is_recommend = isRecommend ? 1 : 0;
    }

    if (introType) {
      const introMap: Record<string, string> = {
        best: "is_best",
        new: "is_new",
        hot: "is_hot",
        recommend: "is_recommend",
      };
      const targetKey = introMap[introType];
      if (targetKey) {
        where[targetKey] = 1;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.product_price = {};
      if (minPrice !== undefined) {
        where.product_price.gte = minPrice as any;
      }
      if (maxPrice !== undefined) {
        where.product_price.lte = maxPrice as any;
      }
    }

    const normalizedIds = this.normalizeIds(ids);
    if (normalizedIds.length > 0) {
      where.product_id = { in: normalizedIds };
    }

    // 确保排序字段使用正确的数据库字段名
    const finalOrderBy: any = {};
    // 常见排序字段映射（驼峰 -> 下划线）
    const sortFieldMap: Record<string, string> = {
      productId: "product_id",
      productPrice: "product_price",
      productStock: "product_stock",
      virtualSales: "virtual_sales",
      sortOrder: "sort_order",
      addTime: "add_time",
      lastUpdate: "last_update",
      productStatus: "product_status",
      clickCount: "click_count",
    };
    const prismaSortField = sortFieldMap[sortField] || sortField;
    finalOrderBy[prismaSortField] = sortOrder;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: Number(size), // 确保size是数字类型
        orderBy: finalOrderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const records = await this.buildProductListResponse(products, normalizedIds);
    const waitingCheckedCount = await this.getWaitingCheckedCount(queryDto);

    return camelCase(
      {
        records,
        total,
        waiting_checked_count: waitingCheckedCount,
      },
      false,
    );
  }

  async getProductsPromotion(payload: any) {
    const productsInput = Array.isArray(payload?.products) ? payload.products : [];
    if (productsInput.length === 0) {
      return {};
    }

    const promotionFrom = typeof payload?.from === "string" && payload.from ? payload.from : "list";
    const shopIdRaw = payload?.shopId ?? payload?.shop_id ?? null;
    let explicitShopId: number | null = null;
    if (shopIdRaw !== null && shopIdRaw !== undefined && shopIdRaw !== "") {
      const parsed = Number(shopIdRaw);
      explicitShopId = Number.isFinite(parsed) ? parsed : null;
    }

    const normalizedList = productsInput
      .map((item: any) => {
        const source = item ?? {};
        const productId = Number(source.productId ?? source.product_id ?? 0) || 0;
        const skuId = Number(source.skuId ?? source.sku_id ?? 0) || 0;
        const cartId = Number(source.cartId ?? source.cart_id ?? 0) || 0;
        return { source, productId, skuId, cartId };
      })
      .filter((entry) => entry.productId > 0 || entry.skuId > 0 || entry.cartId > 0);

    if (normalizedList.length === 0) {
      return {};
    }

    const productIds = Array.from(
      new Set(normalizedList.map((entry) => entry.productId).filter((id) => id > 0)),
    );

    let productRows: any[] = [];
    if (productIds.length > 0) {
      productRows = await this.prisma.product.findMany({
        where: { product_id: { in: productIds } },
        select: {
          product_id: true,
          shop_id: true,
          product_price: true,
          market_price: true,
          product_name: true,
          pic_thumb: true,
          pic_url: true,
        },
      });
    }
    const productInfoMap = new Map<number, any>(
      productRows.map((row) => [Number(row.product_id), row]),
    );

    const toSnake = (key: string) =>
      key
        .replace(/([A-Z])/g, "_$1")
        .replace(/__/g, "_")
        .toLowerCase();

    const result: Record<string, any> = {};
    const orderedKeys: string[] = [];

    for (const entry of normalizedList) {
      const { source, productId, skuId, cartId } = entry;

      let key: string | number;
      if (promotionFrom === "cart") {
        key = cartId || productId || skuId;
      } else if (promotionFrom === "detail") {
        key = skuId || productId;
      } else {
        key = productId;
      }
      if (!key) {
        continue;
      }

      const merged: any = {};
      for (const [k, v] of Object.entries(source)) {
        if (v === undefined) continue;
        if (k == null) continue;
        const snakeKey = toSnake(k);
        merged[snakeKey] = v;
      }

      if (!merged.product_id && productId) merged.product_id = productId;
      if (!merged.sku_id && skuId) merged.sku_id = skuId;
      if (!merged.cart_id && cartId) merged.cart_id = cartId;

      const dbRow = productInfoMap.get(productId);
      const resolvedShopId =
        explicitShopId !== null
          ? explicitShopId
          : merged.shop_id !== undefined
          ? Number(merged.shop_id)
          : dbRow?.shop_id ?? null;
      if (resolvedShopId !== null && resolvedShopId !== undefined) {
        merged.shop_id = Number(resolvedShopId) || 0;
      }

      if (dbRow) {
        if (merged.product_name === undefined && dbRow.product_name) {
          merged.product_name = dbRow.product_name;
        }
        if (merged.pic_thumb === undefined && dbRow.pic_thumb) {
          merged.pic_thumb = dbRow.pic_thumb;
        }
        if (merged.pic_url === undefined && dbRow.pic_url) {
          merged.pic_url = dbRow.pic_url;
        }
        if (merged.product_price === undefined && dbRow.product_price !== undefined) {
          merged.product_price = this.toMoney(dbRow.product_price);
        }
        if (merged.market_price === undefined && dbRow.market_price !== undefined) {
          merged.market_price = this.toMoney(dbRow.market_price);
        }
      }

      if (merged.price === undefined && merged.product_price !== undefined) {
        merged.price = merged.product_price;
      }

      merged.activity_info = Array.isArray(merged.activity_info)
        ? merged.activity_info
        : [];

      const keyStr = String(key);
      if (!(keyStr in result)) {
        orderedKeys.push(keyStr);
      }
      result[keyStr] = merged;
    }

    // 1) 拉取所有进行中的活动（对齐 PHP PromotionService::getAllAvailablePromotion）
    const now = Math.floor(Date.now() / 1000);
    const whereSqlParts: string[] = [
      "( (start_time <= ?) AND (end_time >= ?) ) OR (start_time = 0 AND end_time = 0)",
    ];
    const sqlParams: any[] = [now, now];
    // is_available = 1
    whereSqlParts.push("(is_available = 1 OR is_available IS NULL)");
    // 按店铺筛选（若请求显式指定了 shopId）
    if (explicitShopId !== null) {
      whereSqlParts.push("shop_id = ?");
      sqlParams.push(explicitShopId);
    }
    const whereSql = whereSqlParts.length > 0 ? "WHERE " + whereSqlParts.join(" AND ") : "";
    // PHP 中按 FIELD(type, 1,6,2,3,4,5) 排序；为兼容性改为 CASE 表达式
    const orderSql =
      "ORDER BY CASE `type` WHEN 1 THEN 1 WHEN 6 THEN 2 WHEN 2 THEN 3 WHEN 3 THEN 4 WHEN 4 THEN 5 WHEN 5 THEN 6 ELSE 7 END";

    const promotions: any[] = (await this.prisma.$queryRawUnsafe(
      `SELECT \`promotion_id\`, \`promotion_name\`, \`start_time\`, \`end_time\`, \`type\`, \`shop_id\`, \`relation_id\`, \`range\`, \`range_data\`, \`sku_ids\`, \`is_available\`, \`is_delete\`
       FROM \`promotion\` ${whereSql} ${orderSql}`,
      ...sqlParams,
    )) as any[];

    // 2) 逐个商品匹配活动
    const attachPromotionData = async (prom: any): Promise<any> => {
      const enriched: any = { ...prom };
      // 对齐 PHP：$promotion['data'] = $promotion->realPromotion
      // 这里只在满赠(type=5)时，补齐 gift 相关信息；其它类型按需补齐可后续完善
      if (Number(prom.type) === 5 && prom.relation_id) {
        try {
          const pp = await this.prisma.product_promotion.findFirst({
            where: { promotion_id: Number(prom.relation_id) },
          });
          if (pp) {
            const typeData = this.safeJsonParse(pp.promotion_type_data, [] as any[]);
            // 收集 giftId 并批量查询
            const giftIds = Array.from(
              new Set(
                typeData
                  .map((d: any) => Number(d?.giftId ?? d?.gift_id ?? 0))
                  .filter((n) => Number.isFinite(n) && n > 0),
              ),
            );
            let giftMap = new Map<number, any>();
            if (giftIds.length > 0) {
              const gifts = await this.prisma.product_gift.findMany({
                where: { gift_id: { in: giftIds } },
              });
              // 取 product 与 sku 基础信息，拼出与 PHP 近似结构
              const gProductIds = Array.from(
                new Set(gifts.map((g) => Number(g.product_id)).filter((n) => Number.isFinite(n) && n > 0)),
              );
              const gSkuIds = Array.from(
                new Set(gifts.map((g) => Number(g.sku_id)).filter((n) => Number.isFinite(n) && n > 0)),
              );
              const [giftProducts, giftSkus] = await Promise.all([
                gProductIds.length > 0
                  ? this.prisma.product.findMany({
                      where: { product_id: { in: gProductIds } },
                      select: {
                        product_id: true,
                        product_name: true,
                        product_price: true,
                        pic_thumb: true,
                        product_sn: true,
                        product_type: true,
                        shop_id: true,
                      },
                    })
                  : Promise.resolve([]),
                gSkuIds.length > 0
                  ? this.prisma.product_sku.findMany({
                      where: { sku_id: { in: gSkuIds } },
                      select: { sku_id: true, sku_data: true, sku_sn: true, sku_price: true },
                    })
                  : Promise.resolve([]),
              ]);
              const gpMap = new Map<number, any>(
                giftProducts.map((p: any) => [Number(p.product_id), p]),
              );
              const gsMap = new Map<number, any>(giftSkus.map((s: any) => [Number(s.sku_id), s]));
              giftMap = new Map(
                gifts.map((g) => {
                  const prod = gpMap.get(Number(g.product_id));
                  const sku = gsMap.get(Number(g.sku_id));
                  const gift: any = {
                    gift_id: g.gift_id,
                    gift_name: g.gift_name,
                    gift_stock: g.gift_stock,
                    product_id: g.product_id,
                    sku_id: g.sku_id,
                    shop_id: g.shop_id,
                    // 对齐 PHP ProductGift 附加属性
                    product_info: prod
                      ? {
                          product_name: prod.product_name,
                          product_price: this.toMoney(prod.product_price),
                          pic_thumb: prod.pic_thumb,
                          product_sn: prod.product_sn,
                          product_type: prod.product_type,
                          shop_id: prod.shop_id,
                          product_id: prod.product_id,
                        }
                      : null,
                    skuInfo: sku
                      ? {
                          sku_data: sku.sku_data,
                          sku_sn: sku.sku_sn,
                          skuPrice: this.toMoney(sku.sku_price),
                        }
                      : null,
                  };
                  if (gift.skuInfo?.skuPrice && gift.product_info) {
                    gift.product_info.product_price = gift.skuInfo.skuPrice;
                  }
                  return [Number(g.gift_id), gift];
                }),
              );
            }
            const patchedTypeData = typeData.map((d: any) => {
              const giftId = Number(d?.giftId ?? d?.gift_id ?? 0) || 0;
              const gift = giftMap.get(giftId) || null;
              return { ...d, gift };
            });
            enriched.data = {
              promotion_type_data: patchedTypeData,
            };
          }
        } catch (_) {
          // 忽略礼品补充异常，保证主流程
        }
      }
      return enriched;
    };

    const checkPromotionAvailable = async (prom: any, item: any): Promise<boolean> => {
      // range 判断（3=指定商品；4=指定商品不参与；其它=全场）
      const range = Number(prom.range ?? 0);
      const rangeData = this.safeJsonParse(prom.range_data, [] as any[]);
      const skuIds = this.safeJsonParse(prom.sku_ids, [] as any[]);
      const pid = Number(item.product_id || 0);
      const sid = Number(item.sku_id || 0);

      if (pid) {
        if (range === 3 && !rangeData.includes(pid)) return false;
        if (range === 4 && rangeData.includes(pid)) return false;
      }
      if (sid && Array.isArray(skuIds) && skuIds.length > 0) {
        if (!skuIds.includes(sid)) return false;
      }
      // 店铺匹配：若 item.shop_id 为空，回查产品获取
      let itemShopId = Number(item.shop_id || 0);
      if (!itemShopId && pid) {
        const r = productInfoMap.get(pid);
        if (r) itemShopId = Number(r.shop_id || 0);
      }
      if (itemShopId !== Number(prom.shop_id || 0)) return false;
      return true;
    };

    for (const key of orderedKeys) {
      const item = result[key];
      if (!item) continue;
      const activityInfo: any[] = [];
      for (const prom of promotions) {
        // list 模式下跳过 is_delete=1 的活动
        if (promotionFrom === "list" && (prom.is_delete === 1 || prom.is_delete === true)) {
          continue;
        }
        // 条件判断
        const ok = await checkPromotionAvailable(prom, item);
        if (!ok) continue;
        // 补充 data 字段（按需）
        const enriched = await attachPromotionData(prom);
        activityInfo.push(enriched);
        // list 模式：除 type=6(限时折扣) 之外，命中后就停止（允许 type=6 + 另一个并存）
        if (promotionFrom === "list" && Number(prom.type) !== 6) {
          break;
        }
      }
      item.activity_info = activityInfo;
    }

    let orderedList = orderedKeys.map((k) => result[k]).filter(Boolean);
    // 与 PHP 对齐：list 模式下，只返回有命中活动的商品；否则返回空数组
    if (promotionFrom === "list") {
      orderedList = orderedList.filter(
        (it: any) => Array.isArray(it.activity_info) && it.activity_info.length > 0,
      );
    }
    return camelCase(orderedList, false);
  }

  /**
   * 获取待审核商品数量（用于admin列表角标）
   * 对齐PHP：check_status=0 且 is_delete=0
   */
  async getWaitingCheckedCount(query?: any): Promise<number> {
    const where: any = {
      check_status: 0,
      is_delete: 0,
    };
    // 按店铺筛选（若有）
    if (query?.shopId) {
      where.shop_id = Number(query.shopId);
    }
    const count = await this.prisma.product.count({ where });
    return count;
  }

  /**
   * 根据ID查找商品
   * @param id 商品ID
   * @returns 商品详情
   */
  async findById(id: number) {
    // 由于product表有复合主键，需要使用findFirst而不是findUnique
    const product = await this.prisma.product.findFirst({
      where: { product_id: id },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    return product;
  }

  /**
   * 更新商品
   * @param id 商品ID
   * @param updateProductDto 更新数据
   * @returns 更新后的商品
   */
  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findById(id);

    // 如果更新名称，检查是否与其他商品冲突
    if (updateProductDto.name) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          product_name: updateProductDto.name,
          product_id: { not: id },
        },
      });

      if (existingProduct) {
        throw new BadRequestException("商品名称已存在");
      }
    }

    // 使用原始SQL更新商品以绕过XOR类型问题
    const result = (await this.prisma.$queryRaw`
      UPDATE product
      SET
        product_name = ${updateProductDto.name || null},
        subtitle = ${updateProductDto.subtitle || null},
        product_desc = ${updateProductDto.description || null},
        product_price = ${updateProductDto.price || null},
        market_price = ${updateProductDto.marketPrice || null},
        cost_price = ${updateProductDto.costPrice || null},
        product_stock = ${updateProductDto.stock || null},
        virtual_sales = ${updateProductDto.sales || null},
        category_id = ${updateProductDto.categoryId || null},
        brand_id = ${updateProductDto.brandId || null},
        suppliers_id = ${updateProductDto.supplierId || null},
        pic_url = ${updateProductDto.image || null},
        pic_thumb = ${updateProductDto.images || null},
        product_video = ${updateProductDto.video || null},
        weight = ${updateProductDto.weight || null},
        free_shipping = ${updateProductDto.shippingFee || null},
        limit_number = ${updateProductDto.minBuy || null},
        keywords = ${updateProductDto.keywords || null},
        sort_order = ${updateProductDto.sort || null},
        is_best = ${updateProductDto.isBest !== undefined ? updateProductDto.isBest : false},
        is_new = ${updateProductDto.isNew !== undefined ? updateProductDto.isNew : false},
        is_hot = ${updateProductDto.isHot !== undefined ? updateProductDto.isHot : false},
        last_update = UNIX_TIMESTAMP()
      WHERE product_id = ${id}
      RETURNING product_id, product_name, subtitle, product_desc, product_price, market_price, cost_price, product_stock, virtual_sales, category_id, brand_id, suppliers_id, pic_url, pic_thumb, product_video, weight, free_shipping, limit_number, keywords, sort_order, is_best, is_new, is_hot, product_status, add_time, last_update
    `) as any[];

    return result[0];
  }

  /**
   * 删除商品
   * @param id 商品ID
   * @returns 删除结果
   */
  async remove(id: number) {
    await this.findById(id);

    // 由于product表有复合主键，需要使用findFirst找到记录然后删除
    const product = await this.prisma.product.findFirst({
      where: { product_id: id },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    return this.prisma.product.delete({
      where: {
        product_id_brand_id_product_weight: {
          product_id: id,
          brand_id: product.brand_id,
          product_weight: product.product_weight,
        },
      },
    });
  }

  /**
   * 更新商品状态
   * @param id 商品ID
   * @param status 商品状态
   * @returns 更新后的商品
   */
  async updateStatus(id: number, status: string) {
    await this.findById(id);

    // 由于product表有复合主键，需要使用findFirst找到记录然后更新
    const product = await this.prisma.product.findFirst({
      where: { product_id: id },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    return this.prisma.product.update({
      where: {
        product_id_brand_id_product_weight: {
          product_id: id,
          brand_id: product.brand_id,
          product_weight: product.product_weight,
        },
      },
      data: { product_status: status === "ENABLE" ? 1 : 0 },
    });
  }

  /**
   * 获取商品统计
   * @returns 商品统计信息
   */
  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { product_status: 1 } }),
      this.prisma.product.count({ where: { product_status: 0 } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }

  private normalizeIds(val: any): number[] {
    const toNumberArray = (input: any): number[] => {
      if (input == null) return [];
      if (Array.isArray(input)) {
        return input
          .map((x) => Number(String(x).trim()))
          .filter((n) => Number.isFinite(n));
      }
      if (typeof input === "number") {
        return Number.isFinite(input) ? [input] : [];
      }
      if (typeof input === "string") {
        if (!input) return [];
        return input
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => Number.isFinite(n));
      }
      if (typeof input === "object") {
        if (input.data !== undefined) return toNumberArray(input.data);
        if (Array.isArray(input)) return toNumberArray(input);
      }
      return [];
    };

    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return toNumberArray(parsed);
      } catch (_) {
        return toNumberArray(val);
      }
    }
    return toNumberArray(val);
  }

  private async buildProductListResponse(products: any[], normalizedIds: number[]) {
    if (!products || products.length === 0) {
      return [];
    }

    const productIds = products.map((item) => item.product_id);
    const shopIds = Array.from(
      new Set(
        products
          .map((item) => Number(item.shop_id ?? 0))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );
    const now = Math.floor(Date.now() / 1000);

    const [skuRows, seckillRows, shops] = await Promise.all([
      this.prisma.product_sku.findMany({
        where: { product_id: { in: productIds } },
        orderBy: { sku_id: "asc" },
      }),
      this.prisma.seckill_item.findMany({
        where: {
          product_id: { in: productIds },
          seckill_start_time: { lte: now },
          seckill_end_time: { gte: now },
        },
      }),
      shopIds.length > 0
        ? this.prisma.shop.findMany({
            where: { shop_id: { in: shopIds } },
            select: { shop_id: true, shop_title: true },
          })
        : Promise.resolve([]),
    ]);

    const skuMap = new Map<number, any[]>();
    for (const sku of skuRows) {
      const pid = sku.product_id;
      if (!skuMap.has(pid)) {
        skuMap.set(pid, []);
      }
      skuMap.get(pid)?.push({
        sku_id: sku.sku_id,
        product_id: sku.product_id,
        sku_value: sku.sku_value,
        sku_data: sku.sku_data,
        sku_sn: sku.sku_sn,
        sku_stock: Number(sku.sku_stock ?? 0),
        sku_tsn: sku.sku_tsn,
        sku_price: this.toMoney(sku.sku_price),
        vendor_product_sku_id: sku.vendor_product_sku_id,
      });
    }

    const firstSkuMap = new Map<number, any>();
    for (const [pid, list] of skuMap.entries()) {
      if (list.length > 0) {
        firstSkuMap.set(pid, list[0]);
      }
    }

    const seckillMap = new Map<number, { price: number; endTime: number | string }>();
    for (const row of seckillRows) {
      const pid = Number(row.product_id ?? 0);
      if (!pid) continue;
      const price = row.seckill_price instanceof Decimal ? Number(row.seckill_price.toString()) : Number(row.seckill_price ?? 0);
      const endTime = row.seckill_end_time ?? "";
      if (!seckillMap.has(pid) || price < seckillMap.get(pid)!.price) {
        seckillMap.set(pid, { price, endTime });
      }
    }

    const shopMap = new Map<number, { shop_id: number; shop_title: string | null }>();
    for (const shop of shops as any[]) {
      shopMap.set(Number(shop.shop_id), {
        shop_id: Number(shop.shop_id),
        shop_title: shop.shop_title ?? "",
      });
    }

    const records = products.map((product) => {
      const plain: any = { ...product };
      if (plain.product_type !== null && plain.product_type !== undefined) {
        plain.product_type = plain.product_type ? 1 : 0;
      }
      if (plain.is_promote_activity !== null && plain.is_promote_activity !== undefined) {
        plain.is_promote_activity = plain.is_promote_activity ? 1 : 0;
      }

      const productId = Number(product.product_id);
  const basePrice = this.toNumber(product.product_price);
  const baseMarketPrice = this.toNumber(product.market_price);
      let price = basePrice;
      let marketPrice = baseMarketPrice;
      let isSeckill = 0;
      let seckillEnd = "";

      const seckill = seckillMap.get(productId);
      if (seckill && seckill.price > 0) {
        plain.org_product_price = basePrice;
        price = seckill.price;
        marketPrice = basePrice;
        isSeckill = 1;
        seckillEnd = seckill.endTime || "";
      } else {
        const sku = firstSkuMap.get(productId);
        const skuPrice = sku ? this.toNumber(sku.sku_price) : 0;
        if (skuPrice > 0) {
          price = skuPrice;
        }
      }

      const formattedPrice = this.toMoney(price);
      const formattedMarketPrice = this.toMoney(marketPrice);
      plain.price = formattedPrice;
      plain.product_price = formattedPrice;
      plain.market_price = formattedMarketPrice;
      if (plain.org_product_price !== undefined) {
        plain.org_product_price = this.toMoney(plain.org_product_price);
      }
      plain.is_seckill = isSeckill;
      plain.seckill_end_time = seckillEnd || "";
      plain.product_sku = skuMap.get(productId) ?? [];
      plain.shop = shopMap.get(Number(product.shop_id ?? 0)) ?? null;

      return plain;
    });

    if (normalizedIds.length > 0) {
      const recordMap = new Map(records.map((item) => [Number(item.product_id), item]));
      const idSet = new Set(normalizedIds);
      const ordered: any[] = [];
      for (const id of normalizedIds) {
        const record = recordMap.get(id);
        if (record) {
          ordered.push(record);
        }
      }
      for (const record of records) {
        const pid = Number(record.product_id);
        if (!idSet.has(pid)) {
          ordered.push(record);
        }
      }
      return ordered;
    }

    return records;
  }

  private toNumber(val: any): number {
    if (val == null) return 0;
    if (val instanceof Decimal) {
      return Number(val.toString());
    }
    if (typeof val === "string") {
      const num = Number(val);
      return Number.isFinite(num) ? num : 0;
    }
    if (typeof val === "number") {
      return val;
    }
    return Number(val) || 0;
  }

  private toMoney(val: any): string {
    return toMoneyString(this.toNumber(val));
  }

  private safeJsonParse<T = any>(raw: any, def: T): T {
    if (raw == null) return def;
    if (Array.isArray(raw) || typeof raw === "object") return raw as T;
    try {
      const parsed = JSON.parse(String(raw));
      return parsed as T;
    } catch {
      return def;
    }
  }

}
