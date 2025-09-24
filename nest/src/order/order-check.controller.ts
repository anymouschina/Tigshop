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

@ApiTags("Order Checkout")
@Controller("order")
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
    const userId = req.user.userId;
    const flowType = body.flow_type || 1;

    // B2B模式下，判断用户是否实名
    await this.orderCheckService.checkUserCompanyAuth(userId);

    const cartList = await this.orderCheckService.getStoreCarts("", flowType);
    if (!cartList.carts || cartList.carts.length === 0) {
      throw new HttpException("您还未选择商品！", HttpStatus.BAD_REQUEST);
    }

    const useCouponIds: number[] = [];
    const selectUserCouponIds: number[] = [];

    // 构建购物车促销信息
    const builtCartList = await this.orderCheckService.buildCartPromotion(
      cartList,
      userId,
      flowType,
    );

    // 提取使用的优惠券ID
    if (builtCartList.carts) {
      for (const shopCart of builtCartList.carts) {
        if (shopCart.used_promotions) {
          for (const usedPromotion of shopCart.used_promotions) {
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
    };

    await this.orderCheckService.initSet(params);

    const result = {
      address_list: await this.orderCheckService.getAddressList(userId),
      available_payment_type:
        await this.orderCheckService.getAvailablePaymentType(),
      store_shipping_type: await this.orderCheckService.getStoreShippingType(),
      cart_list: builtCartList.carts,
      total: await this.orderCheckService.getTotalFee(builtCartList),
      balance: await this.orderCheckService.getUserBalance(userId),
      points: await this.orderCheckService.getUserPoints(userId),
      available_points: await this.orderCheckService.getOrderAvailablePoints(),
      coupon_list: await this.orderCheckService.getCouponListByPromotion(
        builtCartList,
        useCouponIds,
        selectUserCouponIds,
      ),
      use_coupon_ids: useCouponIds,
      select_user_coupon_ids: selectUserCouponIds,
      tmpl_ids: await this.orderCheckService.getMiniProgramTemplateIds(),
      flow_type: flowType,
      item: params,
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
    const userId = req.user.userId;
    const params = {
      address_id: body.address_id || 0,
      shipping_type: body.shipping_type || [],
      pay_type_id: body.pay_type_id || 1,
      use_point: body.use_point || 0,
      use_balance: body.use_balance || 0,
      flow_type: body.flow_type || 1,
      use_coupon_ids: body.use_coupon_ids || [],
      product_extra: body.product_extra || [],
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

    const cartList = await this.orderCheckService.getStoreCarts(
      "",
      params.flow_type,
    );
    if (!cartList.carts || cartList.carts.length === 0) {
      throw new HttpException("您还未选择商品！", HttpStatus.BAD_REQUEST);
    }

    const builtCartList = await this.orderCheckService.buildCartPromotion(
      cartList,
      userId,
      params.flow_type,
      0,
      params.use_coupon_ids,
    );

    const result = {
      store_shipping_type: await this.orderCheckService.getStoreShippingType(),
      available_payment_type:
        await this.orderCheckService.getAvailablePaymentType(),
      cart_list: builtCartList.carts,
      total: await this.orderCheckService.getTotalFee(builtCartList),
      available_points: await this.orderCheckService.getOrderAvailablePoints(),
      address_list: await this.orderCheckService.getAddressList(userId),
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
    const userId = req.user.userId;
    const params = {
      address_id: body.address_id || 0,
      shipping_type: body.shipping_type || [],
      pay_type_id: body.pay_type_id || 1,
      use_point: body.use_point || 0,
      use_balance: body.use_balance || 0,
      flow_type: body.flow_type || 1,
      use_coupon_ids: body.use_coupon_ids || [],
      select_user_coupon_ids: body.select_user_coupon_ids || [],
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
      "",
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

      if (builtCartList.carts) {
        for (const shopCart of builtCartList.carts) {
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

    const result = {
      coupon_list: await this.orderCheckService.getCouponListByPromotion(
        builtCartList,
        params.use_coupon_ids,
        selectUserCouponIds,
      ),
      use_coupon_ids: params.use_coupon_ids,
      select_user_coupon_ids: selectUserCouponIds,
      cart_list: builtCartList.carts,
      available_points: await this.orderCheckService.getOrderAvailablePoints(),
      total: await this.orderCheckService.getTotalFee(builtCartList),
    };

    return result;
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
    },
  ) {
    const userId = req.user.userId;

    // 检查是否关闭下单
    const closeOrder = await this.orderCheckService.getCloseOrderStatus();
    if (closeOrder === 1) {
      throw new HttpException(
        "商城正在维护已停止下单！",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const params = {
      address_id: body.address_id || 0,
      shipping_type: body.shipping_type || [],
      pay_type_id: body.pay_type_id || 1,
      use_point: body.use_point || 0,
      use_balance: body.use_balance || 0,
      use_coupon_ids: body.use_coupon_ids || [],
      buyer_note: body.buyer_note || "",
      invoice_data: body.invoice_data || [],
      flow_type: body.flow_type || 1,
    };

    await this.orderCheckService.initSet(params);

    const result = await this.orderCheckService.submit();
    return {
      order_id: result.order_id,
      return_type: result.unpaid_amount > 0 ? 1 : 2,
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
    const userId = req.user.userId;
    const params = {
      invoice_type: query.invoice_type || 0,
      title_type: query.title_type || 0,
      user_id: userId,
    };

    const item = await this.orderCheckService.checkInvoice(params);
    return item;
  }
}
