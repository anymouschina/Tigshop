import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CartItem {
  productId: number;
  quantity: number;
  selected?: boolean;
}

export interface CartData {
  items: CartItem[];
  totalPrice: number;
  totalQuantity: number;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 添加商品到购物车
   * @param userId 用户ID
   * @param productId 商品ID
   * @param quantity 数量
   * @returns 更新后的购物车
   */
  async addItem(userId: number, productId: number, quantity: number = 1) {
    // 验证商品是否存在且启用
    const product = await this.prisma.product.findUnique({
      where: { productId },
      include: { Brand: true, Category: true },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (!product.isEnable) {
      throw new BadRequestException('商品已下架');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('库存不足');
    }

    // 获取或创建用户购物车
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // 检查购物车中是否已有该商品
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.cartId,
        productId,
      },
    });

    let cartItem;

    if (existingItem) {
      // 更新数量
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException('库存不足');
      }

      cartItem = await this.prisma.cartItem.update({
        where: { cartItemId: existingItem.cartItemId },
        data: { quantity: newQuantity },
      });
    } else {
      // 添加新商品到购物车
      cartItem = await this.prisma.cartItem.create({
        data: {
          cartId: cart.cartId,
          productId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * 更新购物车商品数量
   * @param userId 用户ID
   * @param cartItemId 购物车项ID
   * @param quantity 新数量
   * @returns 更新后的购物车
   */
  async updateQuantity(userId: number, cartItemId: number, quantity: number) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { cartItemId },
      include: {
        Product: true,
        Cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('购物车商品不存在');
    }

    if (cartItem.Cart.userId !== userId) {
      throw new BadRequestException('无权操作此购物车商品');
    }

    if (quantity <= 0) {
      throw new BadRequestException('数量必须大于0');
    }

    if (quantity > cartItem.Product.stock) {
      throw new BadRequestException('库存不足');
    }

    await this.prisma.cartItem.update({
      where: { cartItemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  /**
   * 删除购物车商品
   * @param userId 用户ID
   * @param cartItemId 购物车项ID
   * @returns 更新后的购物车
   */
  async removeItem(userId: number, cartItemId: number) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { cartItemId },
      include: { Cart: true },
    });

    if (!cartItem) {
      throw new NotFoundException('购物车商品不存在');
    }

    if (cartItem.Cart.userId !== userId) {
      throw new BadRequestException('无权操作此购物车商品');
    }

    await this.prisma.cartItem.delete({
      where: { cartItemId },
    });

    return this.getCart(userId);
  }

  /**
   * 清空购物车
   * @param userId 用户ID
   * @returns 清空结果
   */
  async clearCart(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return { message: '购物车已经是空的' };
    }

    const result = await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.cartId },
    });

    return {
      message: `已清空购物车，删除了 ${result.count} 件商品`,
    };
  }

  /**
   * 获取用户购物车
   * @param userId 用户ID
   * @returns 购物车数据
   */
  async getCart(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        CartItem: {
          include: {
            Product: {
              include: {
                Brand: true,
                Category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      return {
        items: [],
        totalPrice: 0,
        totalQuantity: 0,
      };
    }

    let totalPrice = 0;
    let totalQuantity = 0;
    const items = [];

    for (const item of cart.CartItem) {
      const itemPrice = Number(item.Product.price || 0);
      const itemTotal = itemPrice * item.quantity;
      totalPrice += itemTotal;
      totalQuantity += item.quantity;

      items.push({
        cartItemId: item.cartItemId,
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        selected: true, // 简化处理，所有商品默认选中
        product: item.Product,
        subtotal: itemTotal,
      });
    }

    return {
      items,
      totalPrice,
      totalQuantity,
    };
  }

  /**
   * 获取选中的购物车商品（简化版，返回所有商品）
   * @param userId 用户ID
   * @returns 选中的商品列表
   */
  async getSelectedItems(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        CartItem: {
          include: {
            Product: {
              include: {
                Brand: true,
                Category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return {
        items: [],
        totalPrice: 0,
        totalQuantity: 0,
      };
    }

    let totalPrice = 0;
    let totalQuantity = 0;
    const items = [];

    for (const item of cart.CartItem) {
      const itemPrice = Number(item.Product.price || 0);
      const itemTotal = itemPrice * item.quantity;
      totalPrice += itemTotal;
      totalQuantity += item.quantity;

      items.push({
        cartItemId: item.cartItemId,
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        product: item.Product,
        subtotal: itemTotal,
      });
    }

    return {
      items,
      totalPrice,
      totalQuantity,
    };
  }
}