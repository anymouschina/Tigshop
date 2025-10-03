// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CartService, CartItemDetail } from "../cart/cart.service";
import {
  round as lodashRound,
  sumBy as lodashSumBy,
  toNumber as lodashToNumber,
} from "lodash";

type ShippingSelection = {
  shopId: number;
  typeId: number;
  typeName: string;
};

type CheckoutParams = {
  address_id: number;
  shipping_type: ShippingSelection[];
  pay_type_id: number;
  use_point: number;
  use_balance: number;
  flow_type: number;
  use_coupon_ids: number[];
  select_user_coupon_ids: number[];
  product_extra: Record<string, any> | any[];
  user_id: number;
  buyer_note?: string;
  invoice_data?: any;
};

type CheckoutShop = {
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
    couponIds: number[];
    subtotal: number;
  };
};

type CheckoutTotals = {
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
  serviceFee: number;
};

type ShippingFeeResult = {
  total: number;
  storeShippingFee: number[];
};

@Injectable()
export class OrderCheckService {
  private checkoutParams: CheckoutParams = {
    address_id: 0,
    shipping_type: [],
    pay_type_id: 1,
    use_point: 0,
    use_balance: 0,
    flow_type: 1,
    use_coupon_ids: [],
    select_user_coupon_ids: [],
    product_extra: {},
    user_id: 0,
  };

  private configCache = new Map<string, string | null>();
  private integralScale = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  /**
   * 检查用户企业认证
   */
  async checkUserCompanyAuth(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        is_company_auth: true,
      },
    });

    if (!user) {
      throw new HttpException("用户不存在", HttpStatus.NOT_FOUND);
    }

    const requireIdentity = await this.getConfigBoolean("isIdentity", false);
    const isB2B = Number(process.env.IS_B2B ?? 0) === 1;

    if (requireIdentity && isB2B && Number(user.is_company_auth ?? 0) !== 1) {
      throw new HttpException("请先完成实名认证", HttpStatus.BAD_REQUEST);
    }

    return true;
  }

  /**
   * 获取店铺购物车
   */
  async getStoreCarts(userId: number, flowType: number) {
    if (!userId) {
      return {
        carts: [],
        total: this.recalculateTotals([]),
      };
    }

    const cartData = await this.cartService.getCart(userId);
    const filtered: CheckoutShop[] = [];

    for (const shop of cartData?.cartList ?? []) {
      const checkedItems = (shop?.carts ?? []).filter((item) =>
        this.isCartItemChecked(item),
      );
      if (checkedItems.length === 0) {
        continue;
      }

      const subtotal = this.sumCartSubtotal(checkedItems);

      const shopSummary: CheckoutShop = {
        noShipping: Number(shop?.noShipping ?? 0),
        hasFixedShipping: Number(shop?.hasFixedShipping ?? 0),
        fixedShippingFee: this.toNumber(shop?.fixedShippingFee ?? 0),
        shopId: Number(shop?.shopId ?? 0),
        shopTitle: shop?.shopTitle ?? "",
        carts: checkedItems,
        usedPromotions: Array.isArray(shop?.usedPromotions)
          ? shop.usedPromotions
          : [],
        enableUsePromotion: Array.isArray(shop?.enableUsePromotion)
          ? shop.enableUsePromotion
          : [],
        gift: Array.isArray(shop?.gift) ? shop.gift : [],
        total: {
          discountCouponAmount: this.toNumber(
            shop?.total?.discountCouponAmount ?? 0,
          ),
          discountSeckillAmount: this.toNumber(
            shop?.total?.discountSeckillAmount ?? 0,
          ),
          discountTimeDiscountAmount: this.toNumber(
            shop?.total?.discountTimeDiscountAmount ?? 0,
          ),
          discountProductPromotionAmount: this.toNumber(
            shop?.total?.discountProductPromotionAmount ?? 0,
          ),
          discountDiscountAmount: this.toNumber(
            shop?.total?.discountDiscountAmount ?? 0,
          ),
          discounts: this.toNumber(shop?.total?.discounts ?? 0),
          couponIds: Array.isArray(shop?.total?.couponIds)
            ? shop.total.couponIds
            : [],
          subtotal: this.roundCurrency(subtotal),
        },
      };

      filtered.push(shopSummary);
    }

    const totals = this.recalculateTotals(filtered);

    return {
      carts: filtered,
      total: totals,
    };
  }

  /**
   * 构建购物车促销信息
   */
  async buildCartPromotion(
    cartData: { carts: CheckoutShop[]; total: CheckoutTotals } | null,
    userId: number,
    flowType: number,
    useDefaultCoupon: number = 0,
    useCouponIds: number[] = [],
  ) {
    const cartList = cartData?.carts ?? [];
    const total = cartData?.total ?? this.recalculateTotals(cartList);

    if (useDefaultCoupon === 1 && useCouponIds.length === 0) {
      const autoCoupons = await this.pickAutoCoupons(cartList, userId);
      if (autoCoupons.couponIds.length > 0) {
        useCouponIds = autoCoupons.couponIds;
        this.checkoutParams.use_coupon_ids = [...autoCoupons.couponIds];
        this.checkoutParams.select_user_coupon_ids = [...autoCoupons.userCouponIds];
      }
    }

    return {
      cartList,
      carts: cartList,
      total,
    };
  }

  /**
   * 根据优惠券ID获取用户优惠券ID
   */
  async getUserCouponIdByCouponId(userId: number, couponId: number) {
    const userCoupon = await this.prisma.user_coupon.findFirst({
      where: {
        user_id: userId,
        coupon_id: couponId,
        used_time: 0,
      },
      select: {
        id: true,
      },
    });

    return userCoupon?.id || 0;
  }

  /**
   * 初始化结算参数
   */
  async initSet(params: Partial<CheckoutParams>) {
    const normalizedShipping: ShippingSelection[] = Array.isArray(params?.shipping_type)
      ? params.shipping_type.map((item: any) => ({
          shopId: Number(item?.shopId ?? item?.shop_id ?? 0),
          typeId: Number(item?.typeId ?? item?.shippingTypeId ?? item?.shipping_type_id ?? 1),
          typeName: item?.typeName ?? item?.shippingTypeName ?? item?.shipping_type_name ?? "",
        }))
      : [];

    this.checkoutParams = {
      ...this.checkoutParams,
      ...params,
      shipping_type: normalizedShipping,
      use_coupon_ids: Array.isArray(params?.use_coupon_ids)
        ? params.use_coupon_ids
        : this.checkoutParams.use_coupon_ids,
      select_user_coupon_ids: Array.isArray(params?.select_user_coupon_ids)
        ? params.select_user_coupon_ids
        : this.checkoutParams.select_user_coupon_ids,
    } as CheckoutParams;

    if (typeof params.use_point === "number") {
      this.checkoutParams.use_point = Math.max(params.use_point, 0);
    }
    if (typeof params.use_balance === "number") {
      this.checkoutParams.use_balance = Math.max(params.use_balance, 0);
    }
    if (typeof params.pay_type_id === "number") {
      this.setSelectedPayTypeId(params.pay_type_id);
    }
    if (typeof params.address_id === "number") {
      await this.setSelectedAddress(params.address_id);
    }
  }

  private setSelectedPayTypeId(typeId: number) {
    const allowedTypes = new Set([1, 2, 3]);
    const normalizedType = Number.isFinite(typeId) ? Number(typeId) : 1;

    this.checkoutParams.pay_type_id = allowedTypes.has(normalizedType)
      ? normalizedType
      : 1;
  }

  /**
   * 获取用户地址列表
   */
  async getAddressList(userId: number) {
    const records = await this.prisma.user_address.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_selected: "desc" },
        { is_default: "desc" },
        { address_id: "desc" },
      ],
    });

    return records.map((record: any) => this.transformAddress(record));
  }

  private async setSelectedAddress(addressId: number) {
    const userId = Number(this.checkoutParams?.user_id ?? 0);
    const normalizedId = Number(addressId) || 0;

    this.checkoutParams.address_id = normalizedId;

    if (userId <= 0 || normalizedId <= 0) {
      return;
    }

    const address = await this.prisma.user_address.findFirst({
      where: {
        user_id: userId,
        address_id: normalizedId,
      },
      select: { address_id: true },
    });

    if (!address) {
      throw new HttpException("收货地址不存在", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.$transaction([
      this.prisma.user_address.updateMany({
        where: {
          user_id: userId,
          address_id: normalizedId,
        },
        data: {
          is_selected: 1,
        },
      }),
      this.prisma.user_address.updateMany({
        where: {
          user_id: userId,
          address_id: {
            not: normalizedId,
          },
        },
        data: {
          is_selected: 0,
        },
      }),
    ]);
  }

  /**
   * 获取可用支付方式
   */
  async getAvailablePaymentType() {
    const offlineConfig = await this.prisma.config.findFirst({
      where: {
        biz_code: "useOffline",
        OR: [{ is_del: 0 }, { is_del: null }],
      },
      select: {
        biz_val: true,
      },
    });

    const useOffline = offlineConfig
      ? Number(offlineConfig.biz_val ?? 0) === 1
      : true;

    return [
      {
        typeId: 1,
        typeName: "在线支付",
        disabled: false,
        disabledDesc: "",
        isShow: true,
      },
      {
        typeId: 3,
        typeName: "线下支付",
        disabled: false,
        disabledDesc: "",
        isShow: useOffline,
      },
    ];
  }

  /**
   * 获取店铺配送方式
   */
  async getStoreShippingType(flowType?: number) {
    const shippingTypeParam = Array.isArray(this.checkoutParams?.shipping_type)
      ? this.checkoutParams.shipping_type
      : [];

    const grouped = new Map<number, { shippingTypeId: number; shippingTypeName: string }>();

    for (const entry of shippingTypeParam) {
      const shopId = Number(
        entry?.shopId ?? entry?.shop_id ?? entry?.storeId ?? entry?.store_id ?? 0,
      );

      const shippingTypeId = Number(
        entry?.shippingTypeId ??
          entry?.shipping_type_id ??
          entry?.shipping_type ??
          entry?.id ??
          1,
      );

      const shippingTypeName =
        entry?.shippingTypeName ??
        entry?.shipping_type_name ??
        entry?.name ??
        "普通快递";

      if (!Number.isFinite(shopId)) {
        continue;
      }

      grouped.set(shopId, {
        shippingTypeId: Number.isFinite(shippingTypeId) ? shippingTypeId : 1,
        shippingTypeName,
      });
    }

    if (grouped.size === 0) {
      grouped.set(0, { shippingTypeId: 1, shippingTypeName: "普通快递" });

      const hintedShopId = Number(
        this.checkoutParams?.shopId ??
          this.checkoutParams?.shop_id ??
          this.checkoutParams?.storeId ??
          this.checkoutParams?.store_id ??
          1,
      );

      if (Number.isFinite(hintedShopId) && !grouped.has(hintedShopId)) {
        grouped.set(hintedShopId, {
          shippingTypeId: 1,
          shippingTypeName: "普通快递",
        });
      }
    }

    const sorted = Array.from(grouped.entries()).sort(
      ([a], [b]) => Number(a) - Number(b),
    );

    return sorted.map(([shopId, info]) => [
      {
        typeId: info.shippingTypeId,
        shopId,
        typeName: info.shippingTypeName,
      },
    ]);
  }

  /**
   * 获取订单总费用
   */
  async getTotalFee(cartData: any) {
    if (cartData?.total) {
      return cartData.total;
    }

    const shops = cartData?.cartList ?? cartData?.carts ?? [];

    const productAmountRaw = lodashSumBy(shops, (shop: any) =>
      this.sumCartSubtotal(shop?.carts ?? []),
    );

    const shippingFeeRaw = lodashSumBy(shops, (shop: any) =>
      this.toNumber(shop?.fixedShippingFee ?? 0),
    );

    const checkedCount = Math.max(
      0,
      Math.round(
        lodashSumBy(shops, (shop: any) =>
          this.sumCartQuantity(shop?.carts ?? []),
        ),
      ),
    );

    const productAmount = this.roundCurrency(productAmountRaw);
    const shippingFee = this.roundCurrency(shippingFeeRaw);

    return {
      productAmount,
      checkedCount,
      discounts: 0,
      discountAfter: this.roundCurrency(productAmountRaw),
      totalCount: checkedCount,
      discountCouponAmount: 0,
      discountDiscountAmount: 0,
      discountSeckillAmount: 0,
      discountProductPromotionAmount: 0,
      discountTimeDiscountAmount: 0,
      serviceFee: this.roundCurrency(0),
      paidAmount: 0,
      couponAmount: 0,
      discountAmount: 0,
      exchangePoints: 0,
      pointsAmount: 0,
      shippingFee,
      storeShippingFee: shops.map((shop: any) =>
        this.roundCurrency(shop?.fixedShippingFee ?? 0),
      ),
      totalAmount: this.roundCurrency(productAmountRaw + shippingFeeRaw),
      orderSendPoint: 0,
      balance: 0,
      unpaidAmount: this.roundCurrency(productAmountRaw + shippingFeeRaw),
    };
  }

  /**
   * 获取用户余额
   */
  async getUserBalance(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { balance: true },
    });

    if (!user) {
      return 0;
    }

    const numericBalance = Number(user.balance ?? 0);

    return Number.isFinite(numericBalance) ? numericBalance : 0;
  }

  /**
   * 获取用户积分
   */
  async getUserPoints(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { points: true },
    });

    return user?.points || 0;
  }

  /**
   * 获取订单可用积分
   */
  async getOrderAvailablePoints() {
    // 模拟计算订单可用积分
    return 100;
  }

  /**
   * 根据促销获取优惠券列表
   */
  async getCouponListByPromotion(
    cartList: any,
    useCouponIds: number[],
    selectUserCouponIds: number[],
  ) {
    const userId = Number(this.checkoutParams?.user_id ?? 0);

    if (userId <= 0) {
      return {
        enableCoupons: [],
        disableCoupons: [],
      };
    }

    const shops: CheckoutShop[] = Array.isArray(cartList?.cartList)
      ? cartList.cartList
      : Array.isArray(cartList?.carts)
        ? cartList.carts
        : [];

    if (shops.length === 0) {
      return {
        enableCoupons: [],
        disableCoupons: [],
      };
    }

    const shopSummary = new Map<
      number,
      {
        amount: number;
        productIds: number[];
        productAmountMap: Map<number, number>;
      }
    >();
    let totalProductAmount = 0;

    for (const shop of shops) {
      const carts = Array.isArray(shop?.carts) ? shop.carts : [];
      const amount = this.sumCartSubtotal(carts);
      totalProductAmount += amount;

      const productIds: number[] = [];
      const productAmountMap = new Map<number, number>();

      for (const item of carts) {
        const productId = Number(item?.productId ?? item?.product_id ?? 0);
        if (productId > 0) {
          productIds.push(productId);
          const subtotal = this.toNumber(item?.subtotal ?? 0);
          productAmountMap.set(
            productId,
            (productAmountMap.get(productId) ?? 0) + subtotal,
          );
        }
      }

      shopSummary.set(Number(shop?.shopId ?? 0), {
        amount,
        productIds,
        productAmountMap,
      });
    }

    const nowTs = Math.floor(Date.now() / 1000);

    const userCoupons = await this.prisma.user_coupon.findMany({
      where: {
        user_id: userId,
        used_time: 0,
        order_id: 0,
        start_date: { lte: nowTs },
        end_date: { gte: nowTs },
      },
    });

    if (userCoupons.length === 0) {
      return {
        enableCoupons: [],
        disableCoupons: [],
      };
    }

    const couponIds = userCoupons
      .map((coupon) => Number(coupon.coupon_id ?? 0))
      .filter((id) => id > 0);

    if (couponIds.length === 0) {
      return {
        enableCoupons: [],
        disableCoupons: [],
      };
    }

    const couponRecords = await this.prisma.coupon.findMany({
      where: {
        coupon_id: { in: couponIds },
      },
    });

    const couponMap = new Map<number, any>();
    for (const record of couponRecords) {
      couponMap.set(Number(record.coupon_id), record);
    }

    const enableCoupons: any[] = [];
    const disableCoupons: any[] = [];

    for (const userCoupon of userCoupons) {
      const couponId = Number(userCoupon.coupon_id ?? 0);
      const coupon = couponMap.get(couponId);

      if (!coupon) {
        continue;
      }

      const shopId = Number(coupon.shop_id ?? 0);
      const isGlobal = Number(coupon.is_global ?? 0) === 1;
      const shopInfo = shopSummary.get(shopId);

      const scopeAmount = isGlobal
        ? totalProductAmount
        : shopInfo?.amount ?? 0;

      const scopeProductIds = isGlobal
        ? Array.from(
            new Set(
              Array.from(shopSummary.values()).flatMap((entry) => entry.productIds),
            ),
          )
        : shopInfo?.productIds ?? [];

      const scopeProductAmountMap = isGlobal
        ? (() => {
            const map = new Map<number, number>();
            for (const entry of shopSummary.values()) {
              for (const [productId, subtotal] of entry.productAmountMap) {
                map.set(productId, (map.get(productId) ?? 0) + subtotal);
              }
            }
            return map;
          })()
        : shopInfo?.productAmountMap ?? new Map<number, number>();

      const minOrderAmount = this.toNumber(coupon.min_order_amount ?? 0);
      const sendRange = Number(coupon.send_range ?? 0);
      const sendRangeData = this.parseCouponRangeData(
        coupon.send_range_data ?? [],
      );

      let disabled = false;
      let disableReason = "";

      if (!isGlobal && shopId !== 0 && !shopInfo) {
        disabled = true;
        disableReason = "所结算商品中没有指定的商品";
      }

      if (!disabled && minOrderAmount > scopeAmount) {
        disabled = true;
        disableReason = `满${this.roundCurrency(minOrderAmount)}可用`;
      }

      if (!disabled && sendRange === 3) {
        // 指定商品可用
        const intersection = scopeProductIds.filter((id) =>
          sendRangeData.includes(id),
        );
        if (intersection.length === 0) {
          disabled = true;
          disableReason = "所结算商品中没有指定的商品";
        } else {
          // 只计算范围内商品金额
          const rangeAmount = intersection.reduce((sum, productId) => {
            return sum + (scopeProductAmountMap.get(productId) ?? 0);
          }, 0);
          if (rangeAmount < minOrderAmount) {
            disabled = true;
            disableReason = `指定商品差${this.roundCurrency(minOrderAmount)}可用`;
          }
        }
      }

      if (!disabled && sendRange === 4) {
        // 排除指定商品
        const remainingProducts = scopeProductIds.filter(
          (id) => !sendRangeData.includes(id),
        );
        if (remainingProducts.length === 0) {
          disabled = true;
          disableReason = "所结算商品中没有指定的商品";
        }
      }

      const selected =
        useCouponIds.includes(couponId) &&
        selectUserCouponIds.includes(Number(userCoupon.id));

      const payload = {
        id: Number(userCoupon.id),
        couponId,
        couponSn: userCoupon.coupon_sn ?? "",
        userId,
        usedTime: Number(userCoupon.used_time ?? 0),
        orderId: Number(userCoupon.order_id ?? 0),
        startDate: this.formatTimestamp(userCoupon.start_date),
        endDate: this.formatTimestamp(userCoupon.end_date),
        couponName: coupon.coupon_name ?? "",
        shopId,
        minOrderAmount: this.formatMoney(coupon.min_order_amount ?? 0),
        sendRangeData: JSON.stringify(sendRangeData),
        couponMoney: this.formatMoney(coupon.coupon_money ?? 0),
        couponType: Number(coupon.coupon_type ?? 1),
        couponDiscount: this.formatDiscount(coupon.coupon_discount ?? 0),
        isGlobal: isGlobal ? 1 : 0,
        couponDesc: coupon.coupon_desc ?? "",
        coupon: {
          promotionDesc: coupon.coupon_desc ?? "",
          couponId,
          couponName: coupon.coupon_name ?? "",
          couponMoney: this.formatMoney(coupon.coupon_money ?? 0),
          couponDiscount: this.formatDiscount(coupon.coupon_discount ?? 0),
          couponDesc: coupon.coupon_desc ?? "",
          couponType: Number(coupon.coupon_type ?? 1),
          sendRange: sendRange,
          sendRangeData: Array.isArray(sendRangeData)
            ? JSON.stringify(sendRangeData)
            : "[]",
          minOrderAmount: this.formatMoney(coupon.min_order_amount ?? 0),
          sendStartDate: this.formatTimestamp(coupon.send_start_date),
          sendEndDate: this.formatTimestamp(coupon.send_end_date),
          sendType: Number(coupon.send_type ?? 0),
          useDay: Number(coupon.use_day ?? 0),
          useStartDate: this.formatTimestamp(coupon.use_start_date),
          useEndDate: this.formatTimestamp(coupon.use_end_date),
          isShow: Number(coupon.is_show ?? 0),
          isGlobal: isGlobal ? 1 : 0,
          isNewUser: Number(coupon.is_new_user ?? 0),
          enabledClickGet: Number(coupon.enabled_click_get ?? 0),
          limitUserRank: Array.isArray(coupon.limit_user_rank)
            ? JSON.stringify(coupon.limit_user_rank)
            : String(coupon.limit_user_rank ?? "[]"),
          shopId,
          isDelete: coupon.is_delete ? 1 : 0,
          limitNum: Number(coupon.limit_num ?? 0),
          delayDay: Number(coupon.delay_day ?? 0),
          sendNum: Number(coupon.send_num ?? 0),
          maxOrderAmount: this.formatMoney(coupon.max_order_amount ?? 0),
          couponUnit: Number(coupon.coupon_unit ?? 1),
          reduceType: Number(coupon.reduce_type ?? 1),
          addTime: this.formatTimestamp(coupon.add_time),
        },
        disabled,
        disableReason,
        selected,
      };

      if (disabled) {
        disableCoupons.push(payload);
      } else {
        enableCoupons.push(payload);
      }
    }

    const sortByMoney = (list: any[]) =>
      list.sort((a, b) => this.toNumber(b.couponMoney) - this.toNumber(a.couponMoney));

    return {
      enableCoupons: sortByMoney(enableCoupons),
      disableCoupons: sortByMoney(disableCoupons),
    };
  }

  /**
   * 获取小程序模板消息ID
   */
  async getMiniProgramTemplateIds() {
    // 模拟返回小程序模板消息ID
    return [];
  }

  /**
   * 获取商品附加详情
   */
  async getProductExtraDetail(attrIds: number[]) {
    // 模拟获取商品附加属性详情
    return JSON.stringify({ attr_ids: attrIds });
  }

  /**
   * 更新购物车附加数据
   */
  async updateCartExtraData(cartId: number, extraSkuData: string) {
    await this.prisma.cart.update({
      where: { cart_id: cartId },
      data: { extra_sku_data: extraSkuData },
    });
  }

  /**
   * 获取关闭订单状态
   */
  async getCloseOrderStatus() {
    // 模拟获取关闭订单状态
    return 0;
  }

  /**
   * 提交订单
   */
  async submit() {
    // 模拟订单提交
    const orderId = Date.now();

    const order = await this.prisma.order.create({
      data: {
        order_sn: `ORDER${orderId}`,
        user_id: this.checkoutParams.user_id || 1,
        order_amount: 100,
        shipping_fee: 10,
        pay_status: 0,
        order_status: 0,
        add_time: new Date(),
      },
    });

    return {
      order_id: order.order_id,
      unpaid_amount: order.order_amount,
    };
  }

  /**
   * 检查发票信息
   */
  async checkInvoice(params: any) {
    // 模拟检查发票信息
    return {
      can_invoice: true,
      invoice_content: "商品明细",
    };
  }

  /**
   * 获取使用积分
   */
  getUsePoint() {
    return this.checkoutParams.use_point || 0;
  }

  private async getConfigValue(
    bizCode: string,
    defaultValue: string | null = null,
  ): Promise<string | null> {
    if (this.configCache.has(bizCode)) {
      const cached = this.configCache.get(bizCode) ?? null;
      return cached ?? defaultValue;
    }

    const record = await this.prisma.config.findFirst({
      where: {
        biz_code: bizCode,
        OR: [{ is_del: 0 }, { is_del: null }],
      },
      select: { biz_val: true },
    });

    const value = record?.biz_val ?? null;
    this.configCache.set(bizCode, value);
    return value ?? defaultValue;
  }

  private async getConfigBoolean(
    bizCode: string,
    defaultValue = false,
  ): Promise<boolean> {
    const rawValue = await this.getConfigValue(bizCode);
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return defaultValue;
    }

    const normalized = String(rawValue).trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }

    return defaultValue;
  }

  private roundCurrency(value: any, precision = 2): number {
    const numeric = this.toNumber(value, 0);
    const rounded = lodashRound(numeric, precision);
    if (!Number.isFinite(rounded)) {
      return 0;
    }
    return Number(rounded.toFixed(precision));
  }

  private formatMoney(value: any, precision = 2): string {
    const amount = this.roundCurrency(value, precision);
    return amount.toFixed(precision);
  }

  private formatDiscount(value: any): string {
    const numeric = this.roundCurrency(value, 2);
    if (numeric === 0) {
      return "0";
    }

    const formatted = numeric.toFixed(2);
    return formatted.replace(/\.0+$/, "").replace(/\.([1-9])0$/, ".$1");
  }

  private formatTimestamp(value: any): string {
    const raw = this.toNumber(value, 0);
    if (raw <= 0) {
      return "";
    }

    const milliseconds = raw > 9_999_999_999 ? raw : raw * 1000;
    const date = new Date(milliseconds);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private parseCouponRangeData(data: any): number[] {
    if (data === null || data === undefined) {
      return [];
    }

    if (Array.isArray(data)) {
      return data
        .map((item) => this.toNumber(item, 0))
        .filter((num) => Number.isFinite(num) && num > 0);
    }

    if (typeof data === "string") {
      const trimmed = data.trim();
      if (!trimmed) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);
        return this.parseCouponRangeData(parsed);
      } catch (error) {
        return trimmed
          .split(",")
          .map((part) => this.toNumber(part, 0))
          .filter((num) => Number.isFinite(num) && num > 0);
      }
    }

    if (typeof data === "object") {
      if (Array.isArray((data as any).data)) {
        return this.parseCouponRangeData((data as any).data);
      }

      if (Array.isArray((data as any).ids)) {
        return this.parseCouponRangeData((data as any).ids);
      }

      if (Array.isArray((data as any).items)) {
        return this.parseCouponRangeData((data as any).items);
      }

      return Object.values(data as Record<string, any>).reduce<number[]>(
        (acc, value) => {
          acc.push(...this.parseCouponRangeData(value));
          return acc;
        },
        [],
      );
    }

    return [];
  }

  private toNumber(value: any, defaultValue = 0): number {
    if (value === null || value === undefined) {
      return defaultValue;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : defaultValue;
    }

    if (typeof value === "bigint") {
      return Number(value);
    }

    if (typeof value === "object") {
      if (typeof value.toNumber === "function") {
        const converted = value.toNumber();
        return Number.isFinite(converted) ? converted : defaultValue;
      }

      if (value instanceof Date) {
        return value.getTime();
      }
    }

    const numeric = lodashToNumber(value);
    return Number.isFinite(numeric) ? numeric : defaultValue;
  }

  private isCartItemChecked(item: any): boolean {
    if (!item) {
      return false;
    }

    const raw =
      item.isChecked ??
      item.is_checked ??
      item.checked ??
      item.selected ??
      0;

    if (typeof raw === "boolean") {
      return raw;
    }

    return Number(raw ?? 0) === 1;
  }

  private sumCartSubtotal(carts: CartItemDetail[] = []): number {
    if (!Array.isArray(carts) || carts.length === 0) {
      return 0;
    }

    return lodashSumBy(carts, (item) =>
      this.toNumber(
        item?.subtotal ??
          this.toNumber(item?.originPrice ?? 0) *
            this.toNumber(item?.quantity ?? 1),
      ),
    );
  }

  private sumCartQuantity(carts: CartItemDetail[] = []): number {
    if (!Array.isArray(carts) || carts.length === 0) {
      return 0;
    }

    return lodashSumBy(carts, (item) => this.toNumber(item?.quantity ?? 0));
  }

  private sumCartServiceFee(carts: CartItemDetail[] = []): number {
    if (!Array.isArray(carts) || carts.length === 0) {
      return 0;
    }

    return lodashSumBy(carts, (item) => this.toNumber(item?.serviceFee ?? 0));
  }

  private recalculateTotals(shops: CheckoutShop[]): CheckoutTotals {
    if (!Array.isArray(shops) || shops.length === 0) {
      return {
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
    }

    const productAmountRaw = lodashSumBy(shops, (shop) =>
      this.sumCartSubtotal(shop?.carts ?? []),
    );
    const discountCouponAmountRaw = lodashSumBy(shops, (shop) =>
      this.toNumber(shop?.total?.discountCouponAmount ?? 0),
    );
    const discountDiscountAmountRaw = lodashSumBy(shops, (shop) =>
      this.toNumber(shop?.total?.discountDiscountAmount ?? 0),
    );
    const discountSeckillAmountRaw = lodashSumBy(shops, (shop) =>
      this.toNumber(shop?.total?.discountSeckillAmount ?? 0),
    );
    const discountProductPromotionAmountRaw = lodashSumBy(shops, (shop) =>
      this.toNumber(shop?.total?.discountProductPromotionAmount ?? 0),
    );
    const discountTimeDiscountAmountRaw = lodashSumBy(shops, (shop) =>
      this.toNumber(shop?.total?.discountTimeDiscountAmount ?? 0),
    );
    const discountsRaw = lodashSumBy(shops, (shop) =>
      this.toNumber(shop?.total?.discounts ?? 0),
    );
    const serviceFeeRaw = lodashSumBy(shops, (shop) =>
      this.sumCartServiceFee(shop?.carts ?? []),
    );
    const checkedCount = Math.max(
      0,
      Math.round(
        lodashSumBy(shops, (shop) =>
          this.sumCartQuantity(shop?.carts ?? []),
        ),
      ),
    );

    return {
      productAmount: this.roundCurrency(productAmountRaw),
      checkedCount,
      discounts: this.roundCurrency(discountsRaw),
      discountAfter: this.roundCurrency(productAmountRaw - discountsRaw),
      totalCount: checkedCount,
      discountCouponAmount: this.roundCurrency(discountCouponAmountRaw),
      discountDiscountAmount: this.roundCurrency(discountDiscountAmountRaw),
      discountSeckillAmount: this.roundCurrency(discountSeckillAmountRaw),
      discountProductPromotionAmount: this.roundCurrency(
        discountProductPromotionAmountRaw,
      ),
      discountTimeDiscountAmount: this.roundCurrency(
        discountTimeDiscountAmountRaw,
      ),
      serviceFee: this.roundCurrency(serviceFeeRaw),
    };
  }

  private async pickAutoCoupons(
    shops: CheckoutShop[],
    userId: number,
  ): Promise<{ couponIds: number[]; userCouponIds: number[] }> {
    if (!Array.isArray(shops) || shops.length === 0 || userId <= 0) {
      return { couponIds: [], userCouponIds: [] };
    }

    const couponSet = new Set<number>();

    for (const shop of shops) {
      const couponIds = Array.isArray(shop?.total?.couponIds)
        ? shop.total.couponIds
        : [];

      for (const rawId of couponIds) {
        const couponId = Math.trunc(this.toNumber(rawId, 0));
        if (couponId > 0) {
          couponSet.add(couponId);
        }
      }
    }

    if (couponSet.size === 0) {
      return { couponIds: [], userCouponIds: [] };
    }

    const uniqueCouponIds = Array.from(couponSet.values());
    const userCouponIdList = await Promise.all(
      uniqueCouponIds.map((couponId) =>
        this.getUserCouponIdByCouponId(userId, couponId),
      ),
    );

    const validCoupons = uniqueCouponIds.reduce(
      (acc, couponId, index) => {
        const userCouponId = userCouponIdList[index];
        if (userCouponId > 0) {
          acc.couponIds.push(couponId);
          acc.userCouponIds.push(userCouponId);
        }
        return acc;
      },
      { couponIds: [] as number[], userCouponIds: [] as number[] },
    );

    return validCoupons;
  }

  private transformAddress(address: any) {
    if (!address) {
      return address;
    }

    const regionIds = address.region_ids
      ? String(address.region_ids)
          .split(",")
          .map((part: string) => Number(part))
          .filter((num: number) => Number.isFinite(num) && num !== 0)
      : [];
    if (regionIds.length > 0 && regionIds[0] === 1) {
      regionIds.shift();
    }

    const originalRegionNames = address.region_names
      ? String(address.region_names)
          .split(",")
          .map((part: string) => part.trim())
          .filter((part: string) => part.length > 0)
      : [];

    const regionNames = originalRegionNames.filter((name: string) => name && name !== "中国");
    const displayRegionNames = regionNames.filter(
      (name: string, index: number, arr: string[]) => arr.indexOf(name) === index,
    );

    const isDefault = Number(address.is_default ?? 0) === 1 ? 1 : 0;
    const isSelected = Number(address.is_selected ?? 0) === 1 ? 1 : 0;

    return {
      regionName: displayRegionNames.join(" ").trim(),
      addressId: address.address_id,
      userId: address.user_id,
      consignee: address.consignee,
      email: address.email ?? "",
      regionNames,
      regionIds,
      address: address.address,
      telephone: address.telephone ?? "",
      mobile: address.mobile,
      isSelected,
      isDefault,
      addressTag: address.address_tag ?? "",
      postcode: address.postcode ?? "",
      mobileAreaCode: address.mobile_area_code ?? null,
    };
  }
}
