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
    // 验证商品是否存在且启用
    const product = await this.prisma.product.findUnique({
      where: { productId },
      include: { brand: true, category: true },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    if (product.isDelete !== 0) {
      throw new BadRequestException("商品已下架");
    }

    // 检查库存
    let stock = product.productStock;
    if (skuId > 0) {
      const sku = await this.prisma.productSku.findUnique({
        where: { skuId },
      });
      if (!sku) {
        throw new NotFoundException("SKU不存在");
      }
      stock = sku.skuStock;
    }

    if (stock < quantity) {
      throw new BadRequestException("库存不足");
    }

    // 检查购物车中是否已有该商品（相同SKU）
    const existingItem = await this.prisma.cart.findFirst({
      where: {
        userId,
        productId,
        skuId,
      },
    });

    let cartItem;

    if (existingItem) {
      // 更新数量
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > stock) {
        throw new BadRequestException("库存不足");
      }

      cartItem = await this.prisma.cart.update({
        where: { cartId: existingItem.cartId },
        data: {
          quantity: newQuantity,
          updateTime: new Date(),
        },
      });
    } else {
      // 添加新商品到购物车
      const productData = await this.prisma.product.findUnique({
        where: { productId },
        select: {
          productSn: true,
          picThumb: true,
          shopId: true,
        },
      });

      if (!productData) {
        throw new NotFoundException("商品信息不完整");
      }

      let skuData = null;
      let marketPrice = 0;
      let originalPrice = 0;

      if (skuId > 0) {
        const sku = await this.prisma.productSku.findUnique({
          where: { skuId },
        });
        if (sku) {
          skuData = sku.skuData;
          marketPrice = Number(sku.skuMarketPrice);
          originalPrice = Number(sku.skuPrice);
        }
      } else {
        // Use product price if no SKU
        marketPrice = Number(product.productPrice);
        originalPrice = Number(product.productPrice);
      }

      cartItem = await this.prisma.cart.create({
        data: {
          userId,
          productId,
          productSn: productData.productSn,
          picThumb: productData.picThumb || "",
          marketPrice: marketPrice,
          originalPrice: originalPrice,
          quantity,
          skuId,
          skuData,
          productType: 1,
          isChecked: 1,
          shopId: productData.shopId || 0,
          type: 1,
          updateTime: new Date(),
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
      where: { cartId },
    });

    if (!cartItem) {
      throw new NotFoundException("购物车商品不存在");
    }

    if (cartItem.userId !== userId) {
      throw new BadRequestException("无权操作此购物车商品");
    }

    if (quantity <= 0) {
      throw new BadRequestException("数量必须大于0");
    }

    // 检查库存
    let stock = 0;
    if (cartItem.skuId > 0) {
      const sku = await this.prisma.productSku.findUnique({
        where: { skuId: cartItem.skuId },
      });
      stock = sku?.skuStock || 0;
    } else {
      const product = await this.prisma.product.findUnique({
        where: { productId: cartItem.productId },
      });
      stock = product?.productStock || 0;
    }

    if (quantity > stock) {
      throw new BadRequestException("库存不足");
    }

    await this.prisma.cart.update({
      where: { cartId },
      data: {
        quantity,
        updateTime: new Date(),
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
      where: { cartId },
    });

    if (!cartItem) {
      throw new NotFoundException("购物车商品不存在");
    }

    if (cartItem.userId !== userId) {
      throw new BadRequestException("无权操作此购物车商品");
    }

    await this.prisma.cart.delete({
      where: { cartId },
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
      where: { userId },
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
      where: { userId },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
      orderBy: {
        updateTime: "desc",
      },
    });

    const items = cartItems.map((item) => ({
      cartId: item.cartId,
      productId: item.productId,
      productSn: item.productSn,
      picThumb: item.picThumb,
      marketPrice: Number(item.marketPrice),
      originalPrice: Number(item.originalPrice),
      quantity: item.quantity,
      skuId: item.skuId,
      skuData: item.skuData,
      productType: item.productType,
      isChecked: item.isChecked,
      shopId: item.shopId,
      type: item.type,
      salesmanId: item.salesmanId,
      extraSkuData: item.extraSkuData,
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
      where: { cartId },
    });

    if (!cartItem) {
      throw new NotFoundException("购物车商品不存在");
    }

    if (cartItem.userId !== userId) {
      throw new BadRequestException("无权操作此购物车商品");
    }

    await this.prisma.cart.update({
      where: { cartId },
      data: {
        isChecked,
        updateTime: new Date(),
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
      where: { userId },
      data: {
        isChecked,
        updateTime: new Date(),
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
      where: { userId },
    });

    return { count };
  }
}
