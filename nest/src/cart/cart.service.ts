// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";

export interface CartItem {
  cartId: number;
  productId: number;
  productSn: string;
  picThumb: string;
  marketPrice: number;
  originalPrice: number;
  quantity: number;
  skuId: number;
  skuData?: string;
  productType: number;
  isChecked: number;
  shopId: number;
  type: number;
  salesmanId: number;
  extraSkuData?: string;
}

export interface CartData {
  items: CartItem[];
  totalPrice: number;
  totalQuantity: number;
  selectedTotalPrice: number;
  selectedTotalQuantity: number;
}

@Injectable()
export class CartService {
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
      include: { brand: true, category: true },
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

    // 检查购物车中是否已有该商品（相同SKU）
    const existingItem = await this.prisma.cart.findFirst({
      where: {
        user_id: userId,
        product_id: pid,
        sku_id: sid,
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
        },
      });

      if (!productData) {
        throw new NotFoundException("商品信息不完整");
      }

      let skuData = null as string | null;
      let marketPrice = 0;
      let originalPrice = 0;

      if (sid > 0) {
        const sku = await this.prisma.product_sku.findUnique({
          where: { sku_id: sid },
        });
        if (sku) {
          skuData = sku.sku_data ?? null;
          // 使用商品的市场价作为市场价，SKU价格作为原价
          marketPrice = Number(productData?.market_price ?? 0);
          originalPrice = Number(sku.sku_price ?? 0);
        }
      } else {
        // Use product price if no SKU
        marketPrice = Number(product.market_price ?? 0);
        originalPrice = Number(product.product_price ?? 0);
      }

      cartItem = await this.prisma.cart.create({
        data: {
          user_id: userId,
          product_id: pid,
          product_sn: productData.product_sn,
          pic_thumb: productData.pic_thumb || "",
          market_price: marketPrice,
          original_price: originalPrice,
          quantity: qty,
          sku_id: sid,
          sku_data: skuData ?? undefined,
          product_type: 1,
          is_checked: 1,
          shop_id: productData.shop_id || 0,
          type: 1,
          update_time: Math.floor(Date.now() / 1000),
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
    const cartItems = await this.prisma.cart.findMany({
      where: { user_id: userId },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
      orderBy: {
        update_time: "desc",
      },
    });

    const items = cartItems.map((item) => ({
      cartId: item.cart_id,
      productId: item.product_id,
      productSn: item.product_sn,
      picThumb: item.pic_thumb,
      marketPrice: Number(item.market_price),
      originalPrice: Number(item.original_price),
      quantity: item.quantity,
      skuId: item.sku_id,
      skuData: item.sku_data ?? undefined,
      productType: item.product_type,
      isChecked: item.is_checked,
      shopId: item.shop_id,
      type: item.type,
      salesmanId: item.salesman_id,
      extraSkuData: item.extra_sku_data ?? undefined,
    }));

    const totalPrice = items.reduce(
      (sum, item) => sum + item.originalPrice * item.quantity,
      0,
    );
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const selectedTotalPrice = items
      .filter((item) => item.isChecked === 1)
      .reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
    const selectedTotalQuantity = items
      .filter((item) => item.isChecked === 1)
      .reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      totalPrice,
      totalQuantity,
      selectedTotalPrice,
      selectedTotalQuantity,
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
        cartId: { in: cartIds },
        userId,
      },
    });

    if (cartItems.length !== cartIds.length) {
      throw new BadRequestException("部分购物车商品不存在或无权操作");
    }

    await this.prisma.cart.deleteMany({
      where: {
        cartId: { in: cartIds },
        userId,
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

    return { count };
  }
}
