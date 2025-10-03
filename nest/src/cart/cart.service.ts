// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

const DEFAULT_CART_TYPE = 1;

interface CartSkuDataEntry {
  name: string;
  value: string;
}

interface CartSku {
  skuId: number;
  productId: number;
  skuValue: string;
  skuData: CartSkuDataEntry[];
  skuSn: string;
  skuStock: number;
  skuTsn: string;
  skuPrice: string;
  marketPrice: string;
  costPrice: string | null;
  vendorProductSkuId: number | null;
}

interface ShopInfo {
  statusText: string;
  shopId: number;
  shopTitle: string;
  shopLogo: string;
}

interface ExtraSkuAttrEntry {
  attributesId: number;
  productId: number;
  attrType: number;
  attrName: string;
  attrValue: string;
  attrPrice: string;
  attrColor: string;
  attrPic: string;
  attrPicThumb: string;
}

interface ExtraSkuGroup {
  attrName: string;
  attrList: ExtraSkuAttrEntry[];
}

interface ExtraSkuAllData {
  normal: ExtraSkuAttrEntry[];
  spe: ExtraSkuAttrEntry[];
  extra: ExtraSkuGroup[];
}

export interface CartItemDetail {
  cartId: number;
  userId: number;
  productId: number;
  productSn: string;
  picThumb: string;
  marketPrice: string;
  originalPrice: string;
  quantity: number;
  skuId: number;
  skuData: CartSkuDataEntry[];
  productType: number;
  isChecked: boolean;
  shopId: number;
  type: number;
  updateTime: number;
  salesmanId: number;
  extraSkuData: any[];
  productWeight: string;
  shippingTplId: number;
  freeShipping: number;
  productStatus: number;
  productName: string;
  productPrice: string;
  categoryId: number;
  brandId: number;
  productStock: number;
  cardGroupId: number;
  virtualSample: string;
  suppliersId: number | null;
  shop: ShopInfo;
  sku: CartSku | null;
  fixedShippingType: number;
  fixedShippingFee: string;
  vendorId: number;
  vendorProductId: number;
  vendorProductSkuId: number | null;
  price: number;
  stock: number;
  hasSku: boolean;
  subtotal: string;
  originPrice: number;
  isDisabled: boolean;
  activityInfo: any[];
  serviceFee: string;
  extraSkuAllData: ExtraSkuAllData;
}

export interface CartShopGroup {
  noShipping: number;
  hasFixedShipping: number;
  fixedShippingFee: number;
  shopId: number;
  shopTitle: string;
  carts: CartItemDetail[];
  usedPromotions: any[];
  enableUsePromotion: any[];
  gift: any[];
  total: {
    discountCouponAmount: number;
    discountSeckillAmount: number;
    discountTimeDiscountAmount: number;
    discountProductPromotionAmount: number;
    discountDiscountAmount: number;
    discounts: number;
    couponIds: any[];
  };
}

export interface CartData {
  cartList: CartShopGroup[];
  total: {
    productAmount: number;
    checkedCount: number;
    discounts: number;
    discountAfter: number;
    totalCount: number;
    discountCouponAmount: number;
    discountDiscountAmount: number;
    discountSeckillAmount: number;
    discountProductPromotionAmount: number;
    discountTimeDiscountAmount: number;
    serviceFee: string;
  };
}

const createEmptyAttrGroup = () => ({ normal: [], spe: [], extra: [] });

const formatDecimal = (value: any, digits = 2) => {
  if (value === null || value === undefined) {
    return digits === 3 ? "0.000" : digits === 2 ? "0.00" : "0";
  }
  if (typeof value === "object" && value !== null) {
    if (typeof value.toNumber === "function") {
      return formatDecimal(value.toNumber(), digits);
    }
    if (value instanceof Date) {
      return formatDecimal(value.getTime(), digits);
    }
  }
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return digits === 3 ? "0.000" : digits === 2 ? "0.00" : "0";
  }
  return num.toFixed(digits);
};

const toPlainNumber = (value: any, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    return Number.isNaN(num) ? fallback : num;
  }
  if (typeof value === "object" && value !== null && typeof value.toNumber === "function") {
    const num = value.toNumber();
    return Number.isNaN(num) ? fallback : num;
  }
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const parseJsonSafely = (value: any) => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value) || typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return null;
  }
};

// 对齐 PHP 购物车/订单中 SKU 属性展示逻辑：
// 可能的输入形态（后端历史/兼容多端）：
// 1. 已规范：[{"name":"时长","value":"7"}]
// 2. PHP 原始 attr 结构：[{"attrName":"时长","attrValue":"7"}]
// 3. 下划线形式：[{"attr_name":"时长","attr_value":"7"}]
// 4. 键值被拍平成普通对象：{"时长":"7","颜色":"红"}
// 5. 退化：[{"attrName":"时长"}] （缺 value）
// 之前逻辑把 2 解析成 {name:"attrName", value:"时长"} 错误，这里修正匹配 attrName/attrValue
const normalizeSkuData = (value: any, fallback: any[] = []) => {
  const parsed = parseJsonSafely(value);

  const coerce = (v: any) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const buildPair = (name: any, val: any) => ({
    name: coerce(name),
    value: coerce(val),
  });

  if (Array.isArray(parsed)) {
    const result: { name: string; value: string }[] = [];
    let pendingName: string | null = null;
    for (const entry of parsed) {
      // 允许 entry 是简单值：若有挂起名称则合并
      if (!entry || typeof entry !== "object") {
        if (pendingName) {
          result.push(buildPair(pendingName, entry));
          pendingName = null;
        }
        continue;
      }

      const nameField = (entry as any).name ?? (entry as any).attrName ?? (entry as any).attr_name ?? (entry as any).specName;
      const valueField = (entry as any).value ?? (entry as any).attrValue ?? (entry as any).attr_value ?? (entry as any).specValue;

      // 情况一：同时具备 name & value（或变体）
      if (nameField !== undefined && valueField !== undefined) {
        result.push(buildPair(nameField, valueField));
        pendingName = null;
        continue;
      }

      // 情况二：只有 name（或 attrName）暂存，等待后续 value/attrValue
      if (nameField !== undefined && valueField === undefined) {
        pendingName = coerce(nameField);
        continue;
      }

      // 情况三：只有 value 且前面缓存了 name
      if (nameField === undefined && valueField !== undefined && pendingName) {
        result.push(buildPair(pendingName, valueField));
        pendingName = null;
        continue;
      }

      // 情况四：对象只有一个键，例如 {attrName:"时长"} 或 {value:"7"}
      const keys = Object.keys(entry);
      if (keys.length === 1) {
        const k = keys[0];
        const v = (entry as any)[k];
        if (pendingName && ["value", "attrValue", "attr_value", "specValue"].includes(k)) {
          result.push(buildPair(pendingName, v));
          pendingName = null;
          continue;
        }
        if (k === "attrName" || k === "attr_name") {
          pendingName = coerce(v);
          continue;
        }
        // 普通兜底
        result.push(buildPair(k, v));
        continue;
      }

      // 情况五：KV 展开成普通对象 {"时长":"7","颜色":"红"}
      if (keys.length > 1) {
        for (const k of keys) {
          const v = (entry as any)[k];
          if (pendingName && ["value", "attrValue", "attr_value", "specValue"].includes(k)) {
            result.push(buildPair(pendingName, v));
            pendingName = null;
            continue;
          }
          // 如果 k 看似语义键（包含Name/Value），按已处理逻辑跳过，避免重复
          if (/attrName|attr_value|attrValue|value|specName|specValue/i.test(k)) {
            continue;
          }
          result.push(buildPair(k, v));
        }
      }
    }
    // 若遍历结束仍有挂起的名称但没有 value，不输出（与期望一致）
    if (result.length > 0) return result;
  }

  if (parsed && typeof parsed === "object") {
    // 对象形态：尝试识别 attrName/attrValue 或普通 KV
    if ("attrName" in parsed && ("attrValue" in parsed || "attr_value" in parsed)) {
      return [
        buildPair(
          (parsed as any).attrName,
          (parsed as any).attrValue ?? (parsed as any).attr_value ?? "",
        ),
      ];
    }
    return Object.entries(parsed).map(([key, val]) => buildPair(key, Array.isArray(val) ? val.join(" ") : val));
  }

  return Array.isArray(fallback) ? fallback : [];
};

const normalizeExtraSkuData = (value: any) => {
  const parsed = parseJsonSafely(value);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return parsed;
  return [];
};

const buildAttributeMap = (records: any[]) => {
  const map = new Map<number, any>();
  for (const attr of records ?? []) {
    const productId = attr.product_id;
    if (!map.has(productId)) {
      map.set(productId, {
        normal: [],
        spe: [],
        extra: [],
      });
    }
    const bucket = map.get(productId);
    const attrPayload = {
      attributesId: attr.attributes_id,
      productId: attr.product_id,
      attrType: attr.attr_type,
      attrName: attr.attr_name ?? "",
      attrValue: attr.attr_value ?? "",
      attrPrice: formatDecimal(attr.attr_price ?? 0),
      attrColor: attr.attr_color ?? "",
      attrPic: attr.attr_pic ?? "",
      attrPicThumb: attr.attr_pic_thumb ?? "",
    };

    if (attr.attr_type === 2) {
      let group = bucket.extra.find((entry) => entry.attrName === attrPayload.attrName);
      if (!group) {
        group = {
          attrName: attrPayload.attrName,
          attrList: [],
        };
        bucket.extra.push(group);
      }
      group.attrList.push(attrPayload);
    } else if (attr.attr_type === 1) {
      bucket.spe.push(attrPayload);
    } else {
      bucket.normal.push(attrPayload);
    }
  }
  return map;
};

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 添加商品到购物车
   * @param userId 用户ID
   * @param productId 商品ID
   * @param quantity 数量
   * @param skuId SKU ID
   * @returns 更新后的购物车
   */
  async addItem(
    userId: number,
    productId: number,
    quantity: number = 1,
    skuId: number = 0,
    options?: { type?: number; salesmanId?: number; extraAttrIds?: string | number[] },
  ) {
    // 入参兜底校验，避免 NaN/无效值导致 Prisma where 报错
    const pid = Number(productId);
    const qty = Number(quantity);
    const sid = Number(skuId);

    if (!Number.isInteger(pid) || pid <= 0) {
      throw new BadRequestException("商品ID无效");
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new BadRequestException("数量必须为正整数");
    }
    if (!Number.isInteger(sid) || sid < 0) {
      throw new BadRequestException("SKU参数无效");
    }

    // 验证商品是否存在且启用
    const product = await this.prisma.product.findFirst({
      where: { product_id: pid },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    if (product.is_delete !== 0) {
      throw new BadRequestException("商品已下架");
    }

    // 检查库存
    let stock = product.product_stock;
    if (sid > 0) {
      const sku = await this.prisma.product_sku.findUnique({
        where: { sku_id: sid },
      });
      if (!sku) {
        throw new NotFoundException("SKU不存在");
      }
      stock = sku.sku_stock ?? 0;
    }

    if (stock < qty) {
      throw new BadRequestException("库存不足");
    }

    // 购物车类型与业务员信息
    const cartType = Number(options?.type ?? DEFAULT_CART_TYPE);
    const salesmanId = Number(options?.salesmanId ?? 0) || 0;

    // 检查购物车中是否已有该商品（相同SKU、相同购物车类型）
    const existingItem = await this.prisma.cart.findFirst({
      where: {
        user_id: userId,
        product_id: pid,
        sku_id: sid,
        type: cartType,
      },
    });

    let cartItem;

    if (existingItem) {
      // 更新数量
      const newQuantity = existingItem.quantity + qty;
      if (newQuantity > stock) {
        throw new BadRequestException("库存不足");
      }

      cartItem = await this.prisma.cart.update({
        where: { cart_id: existingItem.cart_id },
        data: {
          quantity: newQuantity,
          update_time: Math.floor(Date.now() / 1000),
        },
      });
    } else {
      // 添加新商品到购物车
      const productData = await this.prisma.product.findFirst({
        where: { product_id: pid },
        select: {
          product_sn: true,
          pic_thumb: true,
          shop_id: true,
          market_price: true,
          product_price: true,
          product_type: true,
        },
      });

      if (!productData) {
        throw new NotFoundException("商品信息不完整");
      }

  let skuData = null as string | null;
  let marketPrice = 0;
  let originalPrice = 0;
  let skuPicThumb: string | null = null;

      if (sid > 0) {
        const sku = await this.prisma.product_sku.findUnique({
          where: { sku_id: sid },
        });
        if (sku) {
          skuData = sku.sku_data ?? null;
          this.logger.debug(`addItem skuData=${JSON.stringify(skuData)}`);
          // 使用商品的市场价作为市场价，SKU价格作为原价；当SKU价格为0或空时回退到商品价
          marketPrice = Number(productData?.market_price ?? 0);
          const skuPriceNum = Number(sku.sku_price ?? 0);
          originalPrice = skuPriceNum > 0 ? skuPriceNum : Number(product.product_price ?? 0);
        }
      } else {
        // Use product price if no SKU
        marketPrice = Number(product.market_price ?? 0);
        originalPrice = Number(product.product_price ?? 0);
      }

      // 处理额外属性 extra_attr_ids -> extra_sku_data（可选）
      let extraSkuDataPayload: any[] | undefined = undefined;
      const rawExtra = options?.extraAttrIds;
      if (rawExtra !== undefined && rawExtra !== null) {
        let attrIds: number[] = [];
        if (Array.isArray(rawExtra)) {
          attrIds = rawExtra
            .map((v) => Number(v))
            .filter((v) => Number.isInteger(v) && v > 0);
        } else if (typeof rawExtra === "string") {
          attrIds = rawExtra
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((v) => Number.isInteger(v) && v > 0);
        }
        if (attrIds.length > 0) {
          const attrs = await this.prisma.product_attributes.findMany({
            where: { attributes_id: { in: attrIds } },
          });
          if (attrs && attrs.length > 0) {
            extraSkuDataPayload = attrs.map((attr) => ({
              attributesId: attr.attributes_id,
              productId: attr.product_id,
              attrType: attr.attr_type,
              attrName: attr.attr_name ?? "",
              attrValue: attr.attr_value ?? "",
              attrPrice: formatDecimal(attr.attr_price ?? 0),
              attrColor: attr.attr_color ?? "",
              attrPic: attr.attr_pic ?? "",
              attrPicThumb: attr.attr_pic_thumb ?? "",
            }));
          }
        }
      }
      this.logger.debug(`skuData=${JSON.stringify(skuData)} extraSkuDataPayload=${JSON.stringify(extraSkuDataPayload)}`);
      console.log(`skuData=${JSON.stringify(skuData)} extraSkuDataPayload=${JSON.stringify(extraSkuDataPayload)}`);
      cartItem = await this.prisma.cart.create({
        data: {
          user_id: userId,
          product_id: pid,
          product_sn: productData.product_sn,
          pic_thumb: (skuPicThumb && skuPicThumb !== "") ? skuPicThumb : (productData.pic_thumb || ""),
          market_price: marketPrice,
          original_price: originalPrice,
          quantity: qty,
          sku_id: sid,
          sku_data: skuData ?? undefined,
          product_type: Number(productData.product_type ?? 1),
          is_checked: 1,
          shop_id: productData.shop_id || 0,
          type: cartType,
          update_time: Math.floor(Date.now() / 1000),
          salesman_id: salesmanId,
          extra_sku_data: extraSkuDataPayload ? JSON.stringify(extraSkuDataPayload) : undefined,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * 更新购物车商品数量
   * @param userId 用户ID
   * @param cartId 购物车项ID
   * @param quantity 新数量
   * @returns 更新后的购物车
   */
  async updateQuantity(userId: number, cartId: number, quantity: number) {
    const cartItem = await this.prisma.cart.findUnique({
      where: { cart_id: cartId },
    });

    if (!cartItem) {
      throw new NotFoundException("购物车商品不存在");
    }

    if (cartItem.user_id !== userId) {
      throw new BadRequestException("无权操作此购物车商品");
    }

    if (quantity <= 0) {
      throw new BadRequestException("数量必须大于0");
    }

    // 检查库存
    let stock = 0;
    if ((cartItem.sku_id ?? 0) > 0) {
      const sku = await this.prisma.product_sku.findUnique({
        where: { sku_id: cartItem.sku_id },
      });
      stock = sku?.sku_stock || 0;
    } else {
      const product = await this.prisma.product.findFirst({
        where: { product_id: cartItem.product_id },
      });
      stock = product?.product_stock || 0;
    }

    if (quantity > stock) {
      throw new BadRequestException("库存不足");
    }

    await this.prisma.cart.update({
      where: { cart_id: cartId },
      data: {
        quantity,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return this.getCart(userId);
  }

  /**
   * 删除购物车商品
   * @param userId 用户ID
   * @param cartId 购物车项ID
   * @returns 更新后的购物车
   */
  async removeItem(userId: number, cartId: number) {
    const cartItem = await this.prisma.cart.findUnique({
      where: { cart_id: cartId },
    });

    if (!cartItem) {
      throw new NotFoundException("购物车商品不存在");
    }

    if (cartItem.user_id !== userId) {
      throw new BadRequestException("无权操作此购物车商品");
    }

    await this.prisma.cart.delete({
      where: { cart_id: cartId },
    });

    return this.getCart(userId);
  }

  /**
   * 清空购物车
   * @param userId 用户ID
   * @returns 空购物车
   */
  async clearCart(userId: number) {
    await this.prisma.cart.deleteMany({
      where: { user_id: userId },
    });

    return this.getCart(userId);
  }

  /**
   * 获取用户购物车
   * @param userId 用户ID
   * @returns 购物车数据
   */
  async getCart(userId: number): Promise<CartData> {
    const cartRows = await this.prisma.cart.findMany({
      where: { user_id: userId },
      orderBy: { update_time: "desc" },
    });

    if (cartRows.length === 0) {
      return {
        cartList: [],
        total: {
          productAmount: 0,
          checkedCount: 0,
          discounts: 0,
          discountAfter: 0,
          totalCount: 0,
          discountCouponAmount: 0,
          discountDiscountAmount: 0,
          discountSeckillAmount: 0,
          discountProductPromotionAmount: 0,
          discountTimeDiscountAmount: 0,
          serviceFee: "0",
        },
      };
    }

    const productIdSet = [...new Set(cartRows.map((row) => row.product_id))];
    const productMap = new Map<number, any>();

    if (productIdSet.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { product_id: { in: productIdSet } },
        select: {
          product_id: true,
          product_name: true,
          product_sn: true,
          product_stock: true,
          product_price: true,
          market_price: true,
          product_weight: true,
          shipping_tpl_id: true,
          free_shipping: true,
          product_status: true,
          category_id: true,
          brand_id: true,
          shop_id: true,
          card_group_id: true,
          virtual_sample: true,
          suppliers_id: true,
          no_shipping: true,
          fixed_shipping_type: true,
          fixed_shipping_fee: true,
          vendor_id: true,
          vendor_product_id: true,
        },
      });
      for (const product of products) {
        productMap.set(product.product_id, product);
      }
    }

    const shopIdSet = [...new Set(cartRows.map((row) => row.shop_id))];
    const shopMap = new Map<number, any>();

    if (shopIdSet.length > 0) {
      const shops = await this.prisma.shop.findMany({
        where: { shop_id: { in: shopIdSet } },
        select: {
          shop_id: true,
          shop_title: true,
          shop_logo: true,
          status: true,
        },
      });
      for (const shop of shops) {
        shopMap.set(shop.shop_id, shop);
      }
    }

    const skuIdSet = [...new Set(cartRows.map((row) => row.sku_id).filter(Boolean))];
    const skuMap = new Map<number, any>();
    if (skuIdSet.length > 0) {
      const skus = await this.prisma.product_sku.findMany({
        where: { sku_id: { in: skuIdSet as number[] } },
      });
      for (const sku of skus) {
        skuMap.set(sku.sku_id, sku);
      }
    }

    const attrRecords = await this.prisma.product_attributes.findMany({
      where: { product_id: { in: productIdSet } },
    });
    const attrMap = buildAttributeMap(attrRecords);
    this.logger.debug(`attrMap=${JSON.stringify([...attrMap])}`);
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const seckillItems = productIdSet.length
      ? await this.prisma.seckill_item.findMany({
          where: {
            product_id: { in: productIdSet },
            seckill_start_time: { lte: nowTimestamp },
            seckill_end_time: { gte: nowTimestamp },
          },
          select: {
            product_id: true,
            sku_id: true,
            seckill_stock: true,
          },
        })
      : [];

    const seckillStockMap = new Map<string, number>();
    for (const item of seckillItems) {
      const key = `${item.product_id ?? 0}:${item.sku_id ?? 0}`;
      seckillStockMap.set(key, toPlainNumber(item.seckill_stock ?? 0));
    }

    const groupedByShop = new Map<number, CartShopGroup>();
    const totalAccumulator = {
      productAmount: 0,
      checkedCount: 0,
      discounts: 0,
      discountAfter: 0,
      totalCount: 0,
      discountCouponAmount: 0,
      discountDiscountAmount: 0,
      discountSeckillAmount: 0,
      discountProductPromotionAmount: 0,
      discountTimeDiscountAmount: 0,
      serviceFee: 0,
    };

    for (const row of cartRows) {
      const product = productMap.get(row.product_id) ?? {};
      const shop = shopMap.get(row.shop_id) ?? {};
      const sku = row.sku_id ? skuMap.get(row.sku_id) ?? null : null;
      const attrGrouping = attrMap.get(row.product_id) ?? createEmptyAttrGroup();

      let shopBucket = groupedByShop.get(row.shop_id);
      if (!shopBucket) {
        const shopTitle = shop?.shop_title ?? "";
        const hasFixedShipping = product?.fixed_shipping_type === 1 ? 1 : 0;
        const fixedFee = hasFixedShipping
          ? toPlainNumber(product?.fixed_shipping_fee ?? 0)
          : 0;
        shopBucket = {
          noShipping: product?.no_shipping ?? 0,
          hasFixedShipping,
          fixedShippingFee: fixedFee,
          shopId: row.shop_id,
          shopTitle,
          carts: [],
          usedPromotions: [],
          enableUsePromotion: [],
          gift: [],
          total: {
            discountCouponAmount: 0,
            discountSeckillAmount: 0,
            discountTimeDiscountAmount: 0,
            discountProductPromotionAmount: 0,
            discountDiscountAmount: 0,
            discounts: 0,
            couponIds: [],
          },
        };
        groupedByShop.set(row.shop_id, shopBucket);
      }

      if (product?.fixed_shipping_type === 1) {
        shopBucket.hasFixedShipping = 1;
        shopBucket.fixedShippingFee += toPlainNumber(
          product?.fixed_shipping_fee ?? 0,
        );
      }
      if (product?.no_shipping === 0) {
        shopBucket.noShipping = 0;
      }

      const skuDataList = normalizeSkuData(row.sku_data ?? sku?.sku_data ?? []);
      this.logger.debug(`cart_id=${row.cart_id} skuDataList=${JSON.stringify(skuDataList)} ${sku?.sku_data}`);
      const extraSkuData = normalizeExtraSkuData(row.extra_sku_data);
  const checked = Number(row.is_checked ?? 0) === 1;
      const skuPriceRaw = sku?.sku_price;
      const priceCandidate =
        (skuPriceRaw !== undefined && skuPriceRaw !== null && Number(skuPriceRaw) > 0
          ? skuPriceRaw
          : row.original_price) ?? product?.product_price ?? 0;
      const priceNumber = toPlainNumber(priceCandidate, 0);
      const subtotal = priceNumber * row.quantity;

      const cartItem: CartItemDetail = {
        cartId: row.cart_id,
        userId: row.user_id,
        productId: row.product_id,
        productSn: row.product_sn,
        picThumb: row.pic_thumb ?? "",
        marketPrice: formatDecimal(product?.market_price ?? row.market_price ?? 0),
        originalPrice: formatDecimal(row.original_price ?? priceNumber ?? 0),
        quantity: row.quantity,
        skuId: row.sku_id ?? 0,
        skuData: skuDataList,
        productType: row.product_type,
        isChecked: checked,
        shopId: row.shop_id,
        type: row.type,
        updateTime: row.update_time,
        salesmanId: row.salesman_id,
        extraSkuData: Array.isArray(extraSkuData) ? extraSkuData : [],
        productWeight: formatDecimal(product?.product_weight ?? 0, 3),
        shippingTplId: product?.shipping_tpl_id ?? 0,
        freeShipping: product?.free_shipping ?? 0,
        productStatus: product?.product_status ?? 0,
        productName: product?.product_name ?? "",
        productPrice: formatDecimal(product?.product_price ?? 0),
        categoryId: product?.category_id ?? 0,
        brandId: product?.brand_id ?? 0,
        productStock: product?.product_stock ?? 0,
        cardGroupId: product?.card_group_id ?? 0,
        virtualSample: product?.virtual_sample ?? "",
        suppliersId: product?.suppliers_id ?? null,
        shop: {
          statusText: "",
          shopId: row.shop_id,
          shopTitle: shop?.shop_title ?? "",
          shopLogo: shop?.shop_logo ?? "",
        },
        sku: sku
          ? {
              skuId: sku.sku_id,
              productId: sku.product_id,
              skuValue: sku.sku_value ?? "",
              skuData: normalizeSkuData(sku.sku_data ?? []),
              skuSn: sku.sku_sn ?? "",
              skuStock: sku.sku_stock ?? 0,
              skuTsn: sku.sku_tsn ?? "",
              skuPrice: formatDecimal(sku.sku_price ?? priceNumber ?? 0),
              marketPrice: formatDecimal(product?.market_price ?? row.market_price ?? 0),
              costPrice: null,
              vendorProductSkuId: sku.vendor_product_sku_id ?? null,
            }
          : null,
        fixedShippingType: product?.fixed_shipping_type ?? 2,
        fixedShippingFee: formatDecimal(product?.fixed_shipping_fee ?? 0),
        vendorId: product?.vendor_id ?? 0,
        vendorProductId: product?.vendor_product_id ?? 0,
    vendorProductSkuId: sku?.vendor_product_sku_id ?? null,
    price: priceNumber,
    stock: product?.product_stock ?? 0,
    hasSku: false,
    subtotal: formatDecimal(subtotal),
    originPrice: priceNumber,
    isDisabled: false,
        activityInfo: [],
        serviceFee: formatDecimal(0),
        extraSkuAllData: attrGrouping ?? createEmptyAttrGroup(),
      };

      cartItem.hasSku = !!sku;

      const seckillKeyExact = `${row.product_id}:${row.sku_id ?? 0}`;
      const seckillKeyFallback = `${row.product_id}:0`;
      const shouldConsiderSeckill = row.type === DEFAULT_CART_TYPE;
      let effectiveStock: number | undefined;

      if (shouldConsiderSeckill) {
        const seckillStock =
          seckillStockMap.get(seckillKeyExact) ?? seckillStockMap.get(seckillKeyFallback);
        if (typeof seckillStock === "number") {
          effectiveStock = seckillStock;
        }
      }

      if (effectiveStock === undefined) {
        effectiveStock = toPlainNumber(
          cartItem.hasSku ? sku?.sku_stock ?? product?.product_stock ?? 0 : product?.product_stock ?? 0,
        );
      }

      cartItem.stock = effectiveStock;
      cartItem.extraSkuAllData = attrGrouping;

      if (cartItem.hasSku && !cartItem.skuId) {
        cartItem.stock = 0;
      }

      cartItem.isDisabled = cartItem.stock <= 0 || cartItem.productStatus === 0;

      if (cartItem.isDisabled && cartItem.isChecked) {
        cartItem.isChecked = false;
      }

      shopBucket.carts.push(cartItem);

      totalAccumulator.totalCount += row.quantity;
      if (cartItem.isChecked) {
        totalAccumulator.checkedCount += row.quantity;
        totalAccumulator.productAmount += subtotal;
      }
    }

    const cartList = Array.from(groupedByShop.values()).map((group) => ({
      ...group,
      fixedShippingFee: Number(group.fixedShippingFee),
      carts: group.carts.map((item) => ({
        ...item,
        subtotal: formatDecimal(item.originPrice * item.quantity),
        isDisabled: item.isDisabled,
      })),
    }));

    const total = {
      productAmount: totalAccumulator.productAmount,
      checkedCount: totalAccumulator.checkedCount,
      discounts: totalAccumulator.discounts,
      discountAfter: totalAccumulator.productAmount - totalAccumulator.discounts,
      totalCount: totalAccumulator.totalCount,
      discountCouponAmount: totalAccumulator.discountCouponAmount,
      discountDiscountAmount: totalAccumulator.discountDiscountAmount,
      discountSeckillAmount: totalAccumulator.discountSeckillAmount,
      discountProductPromotionAmount: totalAccumulator.discountProductPromotionAmount,
      discountTimeDiscountAmount: totalAccumulator.discountTimeDiscountAmount,
      serviceFee: formatDecimal(totalAccumulator.serviceFee),
    };

    return {
      cartList,
      total,
    };
  }

  /**
   * 选择/取消选择购物车商品
   * @param userId 用户ID
   * @param cartId 购物车项ID
   * @param isChecked 是否选中
   * @returns 更新后的购物车
   */
  async updateSelected(userId: number, cartId: number, isChecked: number) {
    const cartItem = await this.prisma.cart.findUnique({
      where: { cart_id: cartId },
    });

    if (!cartItem) {
      throw new NotFoundException("购物车商品不存在");
    }

    if (cartItem.user_id !== userId) {
      throw new BadRequestException("无权操作此购物车商品");
    }

    await this.prisma.cart.update({
      where: { cart_id: cartId },
      data: {
        is_checked: isChecked,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return this.getCart(userId);
  }

  async updateCheckStatus(
    userId: number,
    items: Array<{ cartId: number; isChecked: 0 | 1 }>,
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const deduped = new Map<number, 0 | 1>();
    for (const entry of items) {
      const cartId = Number(entry?.cartId ?? 0);
      if (!Number.isInteger(cartId) || cartId <= 0) {
        continue;
      }
      const normalizedChecked = entry?.isChecked === 1 ? 1 : 0;
      deduped.set(cartId, normalizedChecked);
    }

    if (deduped.size === 0) {
      return;
    }

    const cartIds = Array.from(deduped.keys());

    const ownedCartItems = await this.prisma.cart.findMany({
      where: {
        user_id: userId,
        cart_id: {
          in: cartIds,
        },
      },
      select: { cart_id: true },
    });

    if (ownedCartItems.length === 0) {
      return;
    }

    const allowedIds = new Set(ownedCartItems.map((row) => row.cart_id));

    const operations = Array.from(deduped.entries())
      .filter(([cartId]) => allowedIds.has(cartId))
      .map(([cartId, isChecked]) =>
        this.prisma.cart.update({
          where: { cart_id: cartId },
          data: {
            is_checked: isChecked,
            update_time: Math.floor(Date.now() / 1000),
          },
        }),
      );

    if (operations.length === 0) {
      return;
    }

    await this.prisma.$transaction(operations);
  }

  /**
   * 全选/取消全选购物车商品
   * @param userId 用户ID
   * @param isChecked 是否全选
   * @returns 更新后的购物车
   */
  async updateAllSelected(userId: number, isChecked: number) {
    await this.prisma.cart.updateMany({
      where: { user_id: userId },
      data: {
        is_checked: isChecked,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return this.getCart(userId);
  }

  /**
   * 批量删除购物车商品
   * @param userId 用户ID
   * @param cartIds 购物车项ID数组
   * @returns 更新后的购物车
   */
  async batchRemoveItems(userId: number, cartIds: number[]) {
    // 验证所有购物车项都属于该用户
    const cartItems = await this.prisma.cart.findMany({
      where: {
        cart_id: { in: cartIds },
        user_id: userId,
      },
    });

    if (cartItems.length !== cartIds.length) {
      throw new BadRequestException("部分购物车商品不存在或无权操作");
    }

    await this.prisma.cart.deleteMany({
      where: {
        cart_id: { in: cartIds },
        user_id: userId,
      },
    });

    return this.getCart(userId);
  }

  /**
   * 获取购物车商品数量
   * @param userId 用户ID
   * @returns 购物车商品数量
   */
  async getCartCount(userId: number) {
    const count = await this.prisma.cart.count({
      where: { user_id: userId },
    });

    return count;
  }
}
