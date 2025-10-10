// @ts-nocheck
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { OrderCheckService } from "./order-check.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { resolveRequestUserId } from "src/common/utils/request-user.util";

@ApiTags("Order Checkout")
@Controller("api/order")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderCheckController {
  constructor(private readonly orderCheckService: OrderCheckService) {}

  /**
   * 购物车结算 - 对齐PHP版本 Check/index
   */
  @Post("check/index")
  @ApiOperation({ summary: "购物车结算" })
  async index(
    @Request() req,
    @Body()
    body: {
      flow_type?: number;
      address_id?: number;
      shipping_type?: any;
      pay_type_id?: number;
      use_point?: number;
      use_balance?: number;
      use_coupon_ids?: number[];
      select_user_coupon_ids?: number[];
      product_extra?: any;
    },
  ) {
    const userId = resolveRequestUserId(req);
    const flowType = body.flow_type || 1;

    // B2B模式下，判断用户是否实名
    await this.orderCheckService.checkUserCompanyAuth(userId);

    const cartSource = await this.orderCheckService.getStoreCarts(
      userId,
      flowType,
    );
    if (!cartSource?.carts || cartSource.carts.length === 0) {
      throw new HttpException("您还未选择商品！", HttpStatus.BAD_REQUEST);
    }

    const useCouponIds: number[] = [];
    const selectUserCouponIds: number[] = [];

    // 构建购物车促销信息
    const builtCart = await this.orderCheckService.buildCartPromotion(
      cartSource,
      userId,
      flowType,
    );

    // 提取使用的优惠券ID
    if (builtCart?.cartList) {
      for (const shopCart of builtCart.cartList) {
        const usedPromotions =
          shopCart.usedPromotions ?? shopCart.used_promotions ?? [];
        for (const usedPromotion of usedPromotions) {
          if (usedPromotion.type === 2) {
            useCouponIds.push(usedPromotion.coupon_id);
            const userCouponId =
              await this.orderCheckService.getUserCouponIdByCouponId(
                userId,
                usedPromotion.coupon_id,
              );
            if (userCouponId > 0) {
              selectUserCouponIds.push(userCouponId);
            }
          }
        }
      }
    }

    const params = {
      address_id: body.address_id || 0,
      shipping_type: body.shipping_type || [],
      pay_type_id: body.pay_type_id || 1,
      use_point: body.use_point || 0,
      use_balance: body.use_balance || 0,
      flow_type: flowType,
      use_coupon_ids: useCouponIds,
      select_user_coupon_ids: selectUserCouponIds,
      product_extra: body.product_extra || [],
      user_id: userId,
    };

    await this.orderCheckService.initSet(params);

    const [
      addressList,
      availablePaymentType,
      storeShippingType,
      total,
      balance,
      points,
      availablePoints,
      couponList,
      tmplIds,
      deliveryOption,
    ] = await Promise.all([
      this.orderCheckService.getAddressList(userId),
      this.orderCheckService.getAvailablePaymentType(),
      this.orderCheckService.getStoreShippingType(flowType),
      this.orderCheckService.getTotalFee(builtCart),
      this.orderCheckService.getUserBalance(userId),
      this.orderCheckService.getUserPoints(userId),
      this.orderCheckService.getOrderAvailablePoints(),
      this.orderCheckService.getCouponListByPromotion(
        builtCart,
        useCouponIds,
        selectUserCouponIds,
      ),
      this.orderCheckService.getMiniProgramTemplateIds(),
      this.orderCheckService.buildDeliveryOption(builtCart?.cartList ?? []),
    ]);

    const shippingSelections = Array.isArray(params.shipping_type)
      ? params.shipping_type.map((item: any) => ({
          typeId:
            item?.typeId ??
            item?.shippingTypeId ??
            item?.shipping_type_id ??
            item?.id ??
            1,
          shopId: item?.shopId ?? item?.shop_id ?? 0,
          typeName:
            item?.typeName ??
            item?.shippingTypeName ??
            item?.shipping_type_name ??
            item?.name ??
            "普通快递",
        }))
      : [];

    // 兼容 storeShippingType 可能不是二维数组或无 flat 方法的情况
    let normalizedShipping: any[] = [];
    if (Array.isArray(storeShippingType)) {
      if (typeof (storeShippingType as any).flat === 'function') {
        normalizedShipping = (storeShippingType as any).flat();
      } else {
        // 手动降一维（只处理一层）
        for (const seg of storeShippingType) {
          if (Array.isArray(seg)) normalizedShipping.push(...seg); else normalizedShipping.push(seg);
        }
      }
    } else if (storeShippingType && Array.isArray((storeShippingType as any).list)) {
      normalizedShipping = (storeShippingType as any).list;
    } else if (storeShippingType && Array.isArray((storeShippingType as any).data)) {
      normalizedShipping = (storeShippingType as any).data;
    }

    const fallbackSelections = shippingSelections.length > 0
      ? shippingSelections
      : normalizedShipping.map((item: any) => ({
          typeId: item?.typeId ?? item?.shippingTypeId ?? 1,
          shopId: item?.shopId ?? item?.shop_id ?? 0,
          typeName: item?.typeName ?? item?.shippingTypeName ?? '普通快递',
        }));

    const cartList = builtCart?.cartList ?? [];

    const result = {
      addressList,
      availablePaymentType,
      storeShippingType,
      cartList,
      total,
      balance,
      points,
      availablePoints,
      couponList,
      useCouponIds,
      selectUserCouponIds,
      tmplIds,
      flowType,
      item: {
        addressId: params.address_id,
        shippingType: fallbackSelections,
        payTypeId: params.pay_type_id,
        usePoint: params.use_point,
        useBalance: params.use_balance,
        flowType,
        useCouponIds,
        selectUserCouponIds,
        productExtra: params.product_extra,
      },
      deliveryOption,
    };

    return result;
  }

  /**
   * 更新结算信息 - 对齐PHP版本 Check/update
   */
  @Post("check/update")
  @ApiOperation({ summary: "更新结算信息" })
  async update(
    @Request() req,
    @Body()
    body: {
      address_id?: number;
      shipping_type?: any;
      pay_type_id?: number;
      use_point?: number;
      use_balance?: number;
      flow_type?: number;
      use_coupon_ids?: number[];
      product_extra?: any;
    },
  ) {
    const userId = resolveRequestUserId(req);
    const params = {
      address_id: body.address_id || 0,
      shipping_type: body.shipping_type || [],
      pay_type_id: body.pay_type_id || 1,
      use_point: body.use_point || 0,
      use_balance: body.use_balance || 0,
      flow_type: body.flow_type || 1,
      use_coupon_ids: body.use_coupon_ids || [],
      product_extra: body.product_extra || [],
      user_id: userId,
    };

    await this.orderCheckService.initSet(params);

    // 如果有附加属性就更新购物车
    if (params.product_extra && Object.keys(params.product_extra).length > 0) {
      const attrIds = params.product_extra.extra_attr_ids?.split(",") || [];
      const extraSkuData =
        await this.orderCheckService.getProductExtraDetail(attrIds);
      await this.orderCheckService.updateCartExtraData(
        params.product_extra.cart_id,
        extraSkuData,
      );
    }

    const cartSource = await this.orderCheckService.getStoreCarts(
      userId,
      params.flow_type,
    );
    if (!cartSource?.carts || cartSource.carts.length === 0) {
      throw new HttpException("您还未选择商品！", HttpStatus.BAD_REQUEST);
    }

    const builtCart = await this.orderCheckService.buildCartPromotion(
      cartSource,
      userId,
      params.flow_type,
      0,
      params.use_coupon_ids,
    );

    const [storeShippingType, availablePaymentType, total, availablePoints, addressList] =
      await Promise.all([
        this.orderCheckService.getStoreShippingType(params.flow_type),
        this.orderCheckService.getAvailablePaymentType(),
        this.orderCheckService.getTotalFee(builtCart),
        this.orderCheckService.getOrderAvailablePoints(),
        this.orderCheckService.getAddressList(userId),
      ]);

    const cartList = builtCart?.cartList ?? [];

    const result = {
      storeShippingType,
      availablePaymentType,
      cartList,
      total,
      availablePoints,
      addressList,
      deliveryOption: await this.orderCheckService.buildDeliveryOption(cartList),
    };

    return result;
  }

  /**
   * 获取可用支付方式 - 对齐PHP版本 Check/getAvailablePaymentType
   */
  @Get("check/getAvailablePaymentType")
  @ApiOperation({ summary: "获取可用支付方式" })
  async getAvailablePaymentType() {
    return this.orderCheckService.getAvailablePaymentType();
  }

  /**
   * 获取店铺配送方式 - 对齐PHP版本 Check/getStoreShippingType
   */
  @Get("check/getStoreShippingType")
  @ApiOperation({ summary: "获取店铺配送方式" })
  async getStoreShippingType(
    @Query()
    query: {
      address_id?: number;
      shipping_type?: any;
      pay_type_id?: number;
      use_point?: number;
      use_balance?: number;
      flow_type?: number;
      use_coupon_ids?: number[];
      select_user_coupon_ids?: number[];
    },
  ) {
    const params = {
      address_id: query.address_id || 0,
      shipping_type: query.shipping_type || [],
      pay_type_id: query.pay_type_id || 1,
      use_point: query.use_point || 0,
      use_balance: query.use_balance || 0,
      flow_type: query.flow_type || 1,
      use_coupon_ids: query.use_coupon_ids || [],
      select_user_coupon_ids: query.select_user_coupon_ids || [],
    };

    await this.orderCheckService.initSet(params);
    return this.orderCheckService.getStoreShippingType(params.flow_type);
  }

  /**
   * 更新优惠券 - 对齐PHP版本 Check/updateCoupon
   */
  @Post("check/updateCoupon")
  @ApiOperation({ summary: "更新优惠券" })
  async updateCoupon(
    @Request() req,
    @Body()
    body: {
      address_id?: number;
      shipping_type?: any;
      pay_type_id?: number;
      use_point?: number;
      use_balance?: number;
      flow_type?: number;
      use_coupon_ids?: number[];
      select_user_coupon_ids?: number[];
      use_default_coupon_ids?: number;
    },
  ) {
    const userId = resolveRequestUserId(req);
    const params = {
      address_id: body.address_id || 0,
      shipping_type: body.shipping_type || [],
      pay_type_id: body.pay_type_id || 1,
      use_point: body.use_point || 0,
      use_balance: body.use_balance || 0,
      flow_type: body.flow_type || 1,
      use_coupon_ids: body.use_coupon_ids || [],
      select_user_coupon_ids: body.select_user_coupon_ids || [],
      user_id: userId,
    };

    let useDefaultCoupon = 0;
    if (
      body.use_default_coupon_ids === 1 &&
      params.use_coupon_ids.length === 0
    ) {
      useDefaultCoupon = 1;
    }

    await this.orderCheckService.initSet(params);

    const cartList = await this.orderCheckService.getStoreCarts(
      userId,
      params.flow_type,
    );
    if (!cartList.carts || cartList.carts.length === 0) {
      throw new HttpException("您还未选择商品！", HttpStatus.BAD_REQUEST);
    }

    let selectUserCouponIds = params.select_user_coupon_ids || [];
    const builtCartList = await this.orderCheckService.buildCartPromotion(
      cartList,
      userId,
      params.flow_type,
      useDefaultCoupon,
      params.use_coupon_ids,
    );

    if (useDefaultCoupon === 1) {
      params.use_coupon_ids = [];
      selectUserCouponIds = [];

      const normalizedCartList =
        builtCartList?.cartList ?? builtCartList?.carts ?? [];

      if (normalizedCartList.length > 0) {
        for (const shopCart of normalizedCartList) {
          if (shopCart.used_promotions) {
            for (const usedPromotion of shopCart.used_promotions) {
              if (usedPromotion.type === 2) {
                params.use_coupon_ids.push(usedPromotion.coupon_id);
                const userCouponId =
                  await this.orderCheckService.getUserCouponIdByCouponId(
                    userId,
                    usedPromotion.coupon_id,
                  );
                if (userCouponId > 0) {
                  selectUserCouponIds.push(userCouponId);
                }
              }
            }
          }
        }
      }
    }

    const normalizedCartList =
      builtCartList?.cartList ?? builtCartList?.carts ?? [];

    return {
      couponList: await this.orderCheckService.getCouponListByPromotion(
        builtCartList,
        params.use_coupon_ids,
        selectUserCouponIds,
      ),
      useCouponIds: params.use_coupon_ids,
      selectUserCouponIds,
      cartList: normalizedCartList,
      availablePoints: await this.orderCheckService.getOrderAvailablePoints(),
      total: await this.orderCheckService.getTotalFee(builtCartList),
      deliveryOption: await this.orderCheckService.buildDeliveryOption(normalizedCartList),
    };
  }

  /**
   * 提交订单 - 对齐PHP版本 Check/submit
   */
  @Post("check/submit")
  @ApiOperation({ summary: "提交订单" })
  async submit(
    @Request() req,
    @Body()
    body: {
      address_id?: number;
      shipping_type?: any;
      pay_type_id?: number;
      use_point?: number;
      use_balance?: number;
      use_coupon_ids?: number[];
      buyer_note?: string;
      invoice_data?: any;
      flow_type?: number;
      // 兼容驼峰入参
      addressId?: number;
      shippingType?: any;
      payTypeId?: number;
      usePoint?: number;
      useBalance?: number | string;
      useCouponIds?: number[];
      buyerNote?: string;
      invoiceData?: any;
      flowType?: number;
    },
  ) {
    const userId = resolveRequestUserId(req);

    // 检查是否关闭下单
    const closeOrder = await this.orderCheckService.getCloseOrderStatus();
    if (closeOrder === 1) {
      throw new HttpException(
        "商城正在维护已停止下单！",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 当客户端为微信端时，校验 openid 是否存在（对齐 PHP：UserAuthorizeService::checkUserIsAuthorize）
    // 这里通过常见头部/UA 简单识别，前端也可显式传递 clientType
    const clientType =
      (req.headers["x-client-type"] as string) ||
      (req.headers["x-platform"] as string) ||
      (req.headers["user-agent"] as string) ||
      "";
    const isWechatClient = /miniprogram|micromessenger|wechat/i.test(clientType);
    if (isWechatClient) {
      await this.orderCheckService.ensureWechatOpenId(userId);
    }

    // 兼容驼峰与下划线字段，并进行基础类型规整
    const addressId = Number(body.address_id ?? body.addressId ?? 0);
    const shippingType = (body.shipping_type ?? body.shippingType ?? []) as any;
    const payTypeId = Number(body.pay_type_id ?? body.payTypeId ?? 1);
    const usePoint = Number(body.use_point ?? body.usePoint ?? 0);
    const rawUseBalance = body.use_balance ?? body.useBalance ?? 0;
    const useBalance = Number(rawUseBalance) || 0;
    const useCouponIds = (body.use_coupon_ids ?? body.useCouponIds ?? []) as number[];
    const buyerNote = String(body.buyer_note ?? body.buyerNote ?? "");
    const invoiceData = (body.invoice_data ?? body.invoiceData ?? []) as any;
    const flowType = Number(body.flow_type ?? body.flowType ?? 1);

    const params = {
      address_id: addressId,
      shipping_type: shippingType,
      pay_type_id: payTypeId,
      use_point: usePoint,
      use_balance: useBalance,
      use_coupon_ids: useCouponIds,
      buyer_note: buyerNote,
      invoice_data: invoiceData,
      flow_type: flowType,
      user_id: userId,
    };

    await this.orderCheckService.initSet(params);

    const result = await this.orderCheckService.submit();
    // 返回驼峰字段以契合前端期望
    return {
      orderId: result.order_id,
      returnType: result.unpaid_amount > 0 ? 1 : 2,
    };
  }

  /**
   * 记录发票信息 - 对齐PHP版本 Check/getInvoice
   */
  @Get("check/getInvoice")
  @ApiOperation({ summary: "记录发票信息" })
  async getInvoice(
    @Request() req,
    @Query()
    query: {
      invoice_type?: number;
      title_type?: number;
    },
  ) {
    const userId = resolveRequestUserId(req);
    const params = {
      invoice_type: query.invoice_type || 0,
      title_type: query.title_type || 0,
      user_id: userId,
    };

    const item = await this.orderCheckService.checkInvoice(params);
    return item;
  }
}
