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
      where.category_id = Number(categoryId);
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

    return {
      records,
      total,
      waiting_checked_count: waitingCheckedCount,
    };
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
        ...sku,
        sku_price: sku.sku_price instanceof Decimal ? Number(sku.sku_price.toString()) : Number(sku.sku_price ?? 0),
        sku_stock: Number(sku.sku_stock ?? 0),
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
        seckillEnd = seckill.endTime ? Number(seckill.endTime) || seckill.endTime : "";
      } else {
        const sku = firstSkuMap.get(productId);
        const skuPrice = sku ? Number(sku.sku_price ?? 0) : 0;
        if (skuPrice > 0) {
          price = skuPrice;
        }
      }

      plain.price = price;
      plain.product_price = price;
      plain.market_price = marketPrice;
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

}
