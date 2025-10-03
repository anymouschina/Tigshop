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
import { resolveRequestUserId } from "src/common/utils/request-user.util";

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
    const userId = resolveRequestUserId(req);
    return this.cartService.getCart(userId);
  }

  /**
   * 添加商品到购物车 - 对齐PHP版本 product/product/addToCart
   * 注意：这个接口实际在product.js中定义，但为了功能完整性放在这里
   */
  @Post("addToCart")
  @ApiOperation({ summary: "添加商品到购物车" })
  async addToCart(
    @Request() req,
    @Body() body: Record<string, any>,
    @Query() query: Record<string, any>,
  ) {
    // 兼容旧版 Query 传参与新版 JSON Body 传参，后者优先
    const payload = {
      ...query,
      ...body,
    };

    const rawProductId =
      payload.productId ??
      payload.id ??
      payload.product_id ??
      payload.goodsId ??
      payload.goods_id;
    const rawQuantity =
      payload.quantity ??
      payload.number ??
      payload.num ??
      payload.qty ??
      1;
    const rawSkuId =
      payload.skuId ??
      payload.sku_id ??
      payload.specId ??
      payload.spec_id ??
      payload.productSkuId ??
      0;

    const pid = Number(rawProductId);
    const qty = Number(rawQuantity ?? 1);
    const sid = Number(rawSkuId ?? 0);

    // PHP 端兼容参数
    const isQuick = payload.isQuick === 1 || payload.is_quick === 1 || payload.isQuick === true;
    const typeRaw = payload.type ?? payload.cartType ?? payload.flowType;
    const typeNum = Number(typeRaw ?? 1);
    const salesmanId = Number(payload.salesmanId ?? payload.salesman_id ?? 0) || 0;
    const extraAttrIds = payload.extraAttrIds ?? payload.extra_attr_ids;
    // skuItem 目前忽略批量行为，采用第一个或 sid 为准
    const skuItem = Array.isArray(payload.skuItem ?? payload.sku_item)
      ? (payload.skuItem ?? payload.sku_item)
      : [];
    const firstSku = skuItem.length > 0 ? skuItem[0] : null;
    const finalSkuId = Number(firstSku?.sku_id ?? firstSku?.skuId ?? sid);
    const finalQty = Number(firstSku?.num ?? firstSku?.quantity ?? qty);

    const userId = resolveRequestUserId(req);
    const result = await this.cartService.addItem(userId, pid, finalQty, finalSkuId, {
      type: typeNum > 0 ? typeNum : 1,
      salesmanId,
      extraAttrIds,
    });
    // PHP 返回 { item: true, flow_type }
    return { item: !!result, flow_type: typeNum > 0 ? typeNum : 1 };
  }

  /**
   * 更新购物车商品 - 对齐PHP版本 cart/cart/updateItem
   */
  @Post("updateItem")
  @ApiOperation({ summary: "更新购物车商品" })
  async updateItem(@Request() req, @Body() body: Record<string, any>) {
    const mergedPayload =
      body && typeof body === "object" && body.data && typeof body.data === "object"
        ? { ...body, ...body.data }
        : body || {};

    const cartIdRaw =
      mergedPayload.cartId ??
      mergedPayload.cart_id ??
      body?.cartId ??
      body?.cart_id;

    const quantityRaw =
      mergedPayload.quantity ??
      mergedPayload.number ??
      mergedPayload.num ??
      mergedPayload.qty ??
      mergedPayload.qtyNum;

    const selectedRaw =
      mergedPayload.selected ??
      mergedPayload.isChecked ??
      mergedPayload.is_checked ??
      mergedPayload.checked;

    const cartId = Number(cartIdRaw);
    if (!Number.isInteger(cartId) || cartId <= 0) {
      throw new BadRequestException("购物车ID无效");
    }

    const hasQuantity = quantityRaw !== undefined;
    if (hasQuantity) {
      const quantity = Number(quantityRaw);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException("数量必须为正整数");
      }
  const userId = resolveRequestUserId(req);
      return this.cartService.updateQuantity(userId, cartId, quantity);
    }

    if (selectedRaw !== undefined) {
      const selected = Boolean(
        typeof selectedRaw === "string"
          ? selectedRaw === "1" || selectedRaw.toLowerCase() === "true"
          : selectedRaw,
      );
  const userId = resolveRequestUserId(req);
      return this.cartService.updateSelected(userId, cartId, selected ? 1 : 0);
    }

    return { success: true };
  }

  /**
   * 更新选中状态 - 对齐PHP版本 cart/cart/updateCheck
   */
  @Post("updateCheck")
  @ApiOperation({ summary: "更新购物车商品选中状态" })
  async updateCheck(@Request() req, @Body() body: Record<string, any>) {
    const userId = resolveRequestUserId(req);

    const extractArray = (value: any): any[] => {
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object") return [value];
      return [];
    };

    const rawItems = extractArray(body?.data ?? body?.list ?? body?.items ?? body);

    const deduped = new Map<number, 0 | 1>();

    for (const item of rawItems) {
      const cartId = Number(
        item?.cartId ?? item?.cart_id ?? item?.id ?? item?.cartID,
      );
      if (!Number.isInteger(cartId) || cartId <= 0) {
        continue;
      }
      const flagSource =
        item?.isChecked ??
        item?.is_checked ??
        item?.checked ??
        item?.selected ??
        body?.selected ??
        body?.isChecked ??
        body?.is_checked;
      const isChecked =
        flagSource === true ||
        flagSource === "true" ||
        flagSource === 1 ||
        flagSource === "1"
          ? 1
          : 0;
      deduped.set(cartId, isChecked as 0 | 1);
    }

    const selectedRawFallback =
      body?.selected ?? body?.isChecked ?? body?.is_checked ?? body?.checked;

    if (Array.isArray(body?.cartIds)) {
      const fallbackFlag =
        selectedRawFallback === true ||
        selectedRawFallback === "true" ||
        selectedRawFallback === 1 ||
        selectedRawFallback === "1"
          ? 1
          : 0;
      for (const cartIdValue of body.cartIds) {
        const cartId = Number(cartIdValue);
        if (!Number.isInteger(cartId) || cartId <= 0) {
          continue;
        }
        deduped.set(cartId, fallbackFlag);
      }
    }

    if (deduped.size > 0) {
      await this.cartService.updateCheckStatus(
        userId,
        Array.from(deduped.entries()).map(([cartId, isChecked]) => ({
          cartId,
          isChecked,
        })),
      );
      return this.cartService.getCart(userId);
    }

    if (selectedRawFallback === undefined) {
      return { success: true };
    }

    const isChecked =
      selectedRawFallback === true ||
      selectedRawFallback === "true" ||
      selectedRawFallback === 1 ||
      selectedRawFallback === "1";

    return this.cartService.updateAllSelected(userId, isChecked ? 1 : 0);
  }

  /**
   * 删除购物车商品 - 对齐PHP版本 cart/cart/removeItem
   */
  @Post("removeItem")
  @ApiOperation({ summary: "删除购物车商品" })
  async removeItem(@Request() req, @Body() data: { cartId: number }) {
  const userId = resolveRequestUserId(req);
    return this.cartService.removeItem(userId, Number(data.cartId));
  }

  /**
   * 清空购物车 - 对齐PHP版本 cart/cart/clear
   */
  @Post("clear")
  @ApiOperation({ summary: "清空购物车" })
  async clearCart(@Request() req) {
    const userId = resolveRequestUserId(req);
    return this.cartService.clearCart(userId);
  }

  /**
   * 获取购物车商品数量 - 对齐PHP版本 cart/cart/getCount
   */
  @Get("getCount")
  @ApiOperation({ summary: "获取购物车商品数量" })
  async getCartCount(@Request() req) {
    const userId = resolveRequestUserId(req);
    return this.cartService.getCartCount(userId);
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
