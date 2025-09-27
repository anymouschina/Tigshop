// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Shopping Cart")
@Controller("api/cart/cart")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * 获取购物车列表 - 对齐PHP版本 cart/cart/list
   */
  @Get("list")
  @ApiOperation({ summary: "获取购物车列表" })
  async getCartList(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  /**
   * 添加商品到购物车 - 对齐PHP版本 product/product/addToCart
   * 注意：这个接口实际在product.js中定义，但为了功能完整性放在这里
   */
  @Post("addToCart")
  @ApiOperation({ summary: "添加商品到购物车" })
  async addToCart(
    @Request() req,
    @Query() params: { productId: number; quantity?: number; skuId?: number },
  ) {
    return this.cartService.addItem(
      req.user.userId,
      Number(params.productId),
      Number(params.quantity) || 1,
      Number(params.skuId) || 0,
    );
  }

  /**
   * 更新购物车商品 - 对齐PHP版本 cart/cart/updateItem
   */
  @Post("updateItem")
  @ApiOperation({ summary: "更新购物车商品" })
  async updateItem(
    @Request() req,
    @Body() data: { cartId: number; quantity?: number; selected?: boolean },
  ) {
    if (data.quantity !== undefined) {
      return this.cartService.updateQuantity(
        req.user.userId,
        data.cartId,
        data.quantity,
      );
    }
    if (data.selected !== undefined) {
      return this.cartService.updateSelected(
        req.user.userId,
        data.cartId,
        data.selected ? 1 : 0,
      );
    }
    return { success: true };
  }

  /**
   * 更新选中状态 - 对齐PHP版本 cart/cart/updateCheck
   */
  @Post("updateCheck")
  @ApiOperation({ summary: "更新购物车商品选中状态" })
  async updateCheck(
    @Request() req,
    @Body() data: { cartIds: number[]; selected: boolean },
  ) {
    if (data.cartIds && data.cartIds.length > 0) {
      // 批量更新选中状态
      for (const cartId of data.cartIds) {
        await this.cartService.updateSelected(
          req.user.userId,
          cartId,
          data.selected ? 1 : 0,
        );
      }
      return { success: true };
    }
    // 全选/取消全选
    return this.cartService.updateAllSelected(
      req.user.userId,
      data.selected ? 1 : 0,
    );
  }

  /**
   * 删除购物车商品 - 对齐PHP版本 cart/cart/removeItem
   */
  @Post("removeItem")
  @ApiOperation({ summary: "删除购物车商品" })
  async removeItem(@Request() req, @Body() data: { cartId: number }) {
    return this.cartService.removeItem(req.user.userId, data.cartId);
  }

  /**
   * 清空购物车 - 对齐PHP版本 cart/cart/clear
   */
  @Post("clear")
  @ApiOperation({ summary: "清空购物车" })
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }

  /**
   * 获取购物车商品数量 - 对齐PHP版本 cart/cart/getCount
   */
  @Get("getCount")
  @ApiOperation({ summary: "获取购物车商品数量" })
  async getCartCount(@Request() req) {
    return this.cartService.getCartCount(req.user.userId);
  }

  /**
   * 获取购物车折扣 - 对齐PHP版本 cart/cart/getCouponDiscount
   */
  @Get("getCouponDiscount")
  @ApiOperation({ summary: "获取购物车优惠券折扣" })
  async getCouponDiscount(@Query() query: { couponId: number }) {
    // 简化实现，返回0折扣
    return {
      discountAmount: 0,
      message: "暂无折扣",
    };
  }
}
