// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService as SettingConfigService } from "src/setting/config.service";
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
  freeShippingAll?: number;
  shippingMode?: string;
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
  storeShippingFee: Map<number, number>;
};
type ShippingFeeAccumulator = {
  total: number;
  perShop: Map<number, number>;
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
  private integralScaleCache: number | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly settingConfig: SettingConfigService,
  ) {}

  /**
   * 构建 deliveryOption：对齐 PHP 返回示例，默认 deliveryType=3
   * 仅包含已勾选的商品；补充必要的商品字段（若需要更完整可再扩展）
   */
  async buildDeliveryOption(cartList: CheckoutShop[]) {
    if (!Array.isArray(cartList) || cartList.length === 0) {
      return { deliveryType: 3, deliveryProducts: [], pickupProducts: [] };
    }
    const selectedItems: any[] = [];
    for (const shop of cartList) {
      for (const ci of (shop.carts || [])) {
        if (this.isCartItemChecked(ci)) selectedItems.push(ci);
      }
    }
    if (!selectedItems.length) {
      return { deliveryType: 3, deliveryProducts: [], pickupProducts: [] };
    }
    const productIds = Array.from(new Set(selectedItems.map(i => Number(i.productId))).values()).filter(n => n>0);
    const productRows = productIds.length ? await this.prisma.product.findMany({
      where: { product_id: { in: productIds } },
      select: {
        product_id: true,
        product_name: true,
        product_sn: true,
        product_price: true,
        market_price: true,
        shipping_tpl_id: true,
        product_status: true,
        product_type: true,
        category_id: true,
        brand_id: true,
        shop_id: true,
        product_weight: true,
        product_desc: true,
        product_brief: true,
        add_time: true,
        sort_order: true,
        is_best: true,
        is_new: true,
        is_hot: true,
        last_update: true,
        give_integral: true,
        rank_integral: true,
        virtual_sales: true,
        limit_number: true,
        product_service_ids: true,
        prepay_price: true,
        card_group_id: true,
        virtual_sample: true,
        paid_content: true,
        no_shipping: true,
        fixed_shipping_type: true,
        fixed_shipping_fee: true,
        vendor_product_id: true,
        vendor_id: true,
      }
    }) : [];
    const pMap = new Map<number, any>();
    for (const p of productRows) pMap.set(p.product_id, p);
    const deliveryProducts = selectedItems.map(it => {
      const p = pMap.get(Number(it.productId)) || {};
      return {
        productId: Number(it.productId),
        productName: p.product_name || it.productName || "",
        productSn: p.product_sn || it.productSn || "",
        productTsn: null,
        productStock: Number(it.stock ?? p.product_stock ?? 0),
        productPrice: Number(p.product_price ?? it.productPrice ?? it.price ?? 0),
        marketPrice: Number(p.market_price ?? it.marketPrice ?? 0),
        shippingTplId: Number(it.shippingTplId ?? p.shipping_tpl_id ?? 0),
        productStatus: Number(p.product_status ?? it.productStatus ?? 1),
        productType: Number(p.product_type ?? it.productType ?? 1),
        categoryId: Number(p.category_id ?? it.categoryId ?? 0),
        brandId: Number(p.brand_id ?? it.brandId ?? 0),
        shopId: Number(p.shop_id ?? it.shopId ?? 0),
        keywords: "",
        shopCategoryId: 0,
        checkStatus: 1,
        checkReason: "",
        clickCount: 0,
        productWeight: Number(p.product_weight ?? it.productWeight ?? 0),
        isPromote: 0,
        isPromoteActivity: 0,
        promotePrice: 0,
        promoteStartDate: 0,
        promoteEndDate: 0,
        seckillMaxNum: 0,
        productBrief: p.product_brief || "",
        productDesc: p.product_desc || "",
        picUrl: it.picThumb || "",
        picThumb: it.picThumb || "",
        picOriginal: it.picThumb || "",
        commentTag: null,
        freeShipping: Number(it.freeShipping ?? 0),
        integral: 0,
        addTime: Number(p.add_time ?? 0),
        sortOrder: Number(p.sort_order ?? 100),
        storeSortOrder: Number(p.sort_order ?? 100),
        isDelete: 0,
        isBest: Number(p.is_best ?? 0),
        isNew: Number(p.is_new ?? 0),
        isHot: Number(p.is_hot ?? 0),
        lastUpdate: Number(p.last_update ?? 0),
        remark: "",
        giveIntegral: Number(p.give_integral ?? -1),
        rankIntegral: Number(p.rank_integral ?? -1),
        suppliersId: null,
        virtualSales: Number(p.virtual_sales ?? 0),
        limitNumber: Number(p.limit_number ?? 0),
        productCare: null,
        productRelated: null,
        productServiceIds: p.product_service_ids || "",
        isSupportReturn: 0,
        isSupportCod: 0,
        productVideo: null,
        prepayPrice: Number(p.prepay_price ?? 0),
        cardGroupId: Number(p.card_group_id ?? 0),
        virtualSample: p.virtual_sample || "",
        paidContent: p.paid_content || "",
        noShipping: Number(p.no_shipping ?? it.noShipping ?? 0),
        fixedShippingType: Number(p.fixed_shipping_type ?? it.fixedShippingType ?? 2),
        fixedShippingFee: Number(p.fixed_shipping_fee ?? it.fixedShippingFee ?? 0),
        isShopPickup: 0,
        shopPickupTplId: null,
        vendorProductId: Number(p.vendor_product_id ?? 0) || null,
        vendorId: Number(p.vendor_id ?? 0) || null,
        storeProductName: null,
        storeProductPrice: null,
        storeProductStatus: null,
        storeProductStock: null,
        storeCardGroupId: null,
        isLogistics: 1,
        isShopDelivery: 0,
      };
    });
    return { deliveryType: 3, deliveryProducts, pickupProducts: [] };
  }

  /**
   * 当客户端为微信时校验用户是否已绑定 openid（对齐 PHP：UserAuthorizeService::checkUserIsAuthorize）
   * 未绑定时抛出业务码 5002
   */
  async ensureWechatOpenId(userId: number) {
    const auth = await this.prisma.user_authorize.findFirst({
      where: { user_id: userId },
      select: { open_id: true },
    });
    const openid = auth?.open_id ?? "";
    if (!openid) {
      const err: any = new HttpException("openid为空！", HttpStatus.BAD_REQUEST);
      // 附带与 PHP 一致的业务码（5002）供前端识别
      (err as any).code = 5002;
      throw err;
    }
    return openid;
  }

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
    // 对齐 PHP：Config::get('useOffline')
    // 新配置优先读取 offlinePaySettings.isOpen，否则读取 useOffline，默认 false
    const off = (await this.settingConfig.getJsonConfig(
      "offlinePaySettings",
    )) as any | null;
    let useOffline = false;
    if (off && typeof off === "object") {
      const v = off.isOpen ?? off.open ?? off.enabled ?? off.enable ?? off.status;
      if (v !== undefined) useOffline = v === true || v === "1" || Number(v) === 1;
    }
    if (!useOffline) {
      try {
        const legacy = await this.settingConfig.getConfig("useOffline");
        useOffline = legacy === "1" || legacy === 1 || legacy === true;
      } catch (e) {
        useOffline = false;
      }
    }

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

    const grouped = new Map<
      number,
      { shippingTypeId: number; shippingTypeName: string }
    >();

    // 尝试读取配置中的默认物流名称（失败则回退）
    let defaultName = "普通快递";
    try {
      const cfg = await this.settingConfig.getConfig("defaultLogisticsName");
      if (cfg) defaultName = String(cfg);
    } catch (e) {
      // ignore
    }

    for (const entry of shippingTypeParam) {
      const shopId = Number(
        entry?.shopId ?? entry?.shop_id ?? entry?.storeId ?? entry?.store_id ?? 0,
      );
      if (!Number.isFinite(shopId) || shopId <= 0) continue;

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
        defaultName;
      grouped.set(shopId, {
        shippingTypeId: Number.isFinite(shippingTypeId) ? shippingTypeId : 1,
        shippingTypeName,
      });
    }

    // 基于购物车中出现的店铺补齐默认配送方式
    const userId = Number(this.checkoutParams?.user_id ?? 0);
    const effectiveFlowType = Number(
      flowType ?? this.checkoutParams?.flow_type ?? 1,
    );
    if (userId > 0) {
      try {
        const cartData = await this.getStoreCarts(userId, effectiveFlowType);
        for (const shop of cartData.carts) {
          const shopId = Number(shop?.shopId ?? 0);
          if (!shopId) continue;
            // 仅当该店不是全部虚拟商品 (noShipping==1 表示无需物流，仍可以不给配送方式)；
            // 这里仍然补上，保持与 PHP 行为一致（始终至少返回一条）。
          if (!grouped.has(shopId)) {
            grouped.set(shopId, {
              shippingTypeId: 1,
              shippingTypeName: defaultName,
            });
          }
        }
      } catch (e) {
        // 忽略购物车读取失败，继续使用已有数据
      }
    }

    // 如果仍然为空，返回一个占位（shopId=0），前端可忽略
    if (grouped.size === 0) {
      grouped.set(0, { shippingTypeId: 1, shippingTypeName: defaultName });
    }

    // 转换为对象映射：{ [shopId]: [{ shippingTypeId, shopId, shippingTypeName }] }
    const result: Record<string, any[]> = {};
    for (const [shopId, info] of grouped.entries()) {
      result[String(shopId)] = [
        {
          shippingTypeId: info.shippingTypeId,
          shopId,
          shippingTypeName: info.shippingTypeName,
        },
      ];
    }
    return result;
  }

  /**
   * 获取订单总费用
   */
  async getTotalFee(cartData: any) {
    const shops: CheckoutShop[] = Array.isArray(cartData?.carts)
      ? cartData.carts
      : Array.isArray(cartData?.cartList)
        ? cartData.cartList
        : [];

    const totals = this.recalculateTotals(shops);
    const productAmount = this.roundCurrency(totals.productAmount ?? 0);
    const serviceFee = this.roundCurrency(totals.serviceFee ?? 0);
    // Compute selected coupon deduction based on current selection and cart content
    const couponCalc = await this.calculateSelectedCouponsAmount(shops);
    const couponAmount = this.roundCurrency(couponCalc.totalAmount ?? 0);
    const discountAmount = this.roundCurrency(totals.discountDiscountAmount ?? 0);
    const discountSeckillAmount = this.roundCurrency(
      totals.discountSeckillAmount ?? 0,
    );
    const discountProductPromotionAmount = this.roundCurrency(
      totals.discountProductPromotionAmount ?? 0,
    );
    const discountTimeDiscountAmount = this.roundCurrency(
      totals.discountTimeDiscountAmount ?? 0,
    );
    const discounts = this.roundCurrency(totals.discounts ?? 0);
    const discountAfter = this.roundCurrency(productAmount - discounts);
    // userId 提前获取（仅用于可用积分等后续计算）
    const userId = Number(this.checkoutParams?.user_id ?? 0);
    const shippingFeeResult = await this.calculateShippingFee(shops);
    const shippingFee = shippingFeeResult.total;
    const storeShippingFeeList: number[] = [];
    const storeShippingFeeMap: Record<string, number> = {};

    for (const [shopId, fee] of shippingFeeResult.storeShippingFee.entries()) {
      const roundedFee = this.roundCurrency(fee);
      storeShippingFeeMap[String(shopId)] = roundedFee;
    }

    for (const shop of shops) {
      const shopId = Number(shop?.shopId ?? 0);
      const fee = shippingFeeResult.storeShippingFee.get(shopId) ?? 0;
      storeShippingFeeList.push(this.roundCurrency(fee));
    }

    const availablePoints = userId > 0
      ? await this.calculateAvailablePoints(productAmount, userId)
      : 0;
    const requestedPoints = Math.max(
      this.toNumber(this.checkoutParams?.use_point ?? 0),
      0,
    );
    const usePoint = Math.min(requestedPoints, availablePoints);
    this.checkoutParams.use_point = usePoint;
    const pointsAmount = await this.getPointValueAmount(usePoint);

    const totalAmountRaw =
      productAmount + shippingFee + serviceFee - pointsAmount - discountAmount - couponAmount;
    const totalAmount = this.roundCurrency(Math.max(totalAmountRaw, 0));

    const requestedBalance = Math.max(
      this.toNumber(this.checkoutParams?.use_balance ?? 0),
      0,
    );
    const userBalance = userId > 0 ? await this.getUserBalance(userId) : 0;
    let balance = 0;
    if (requestedBalance > 0 && userBalance > 0 && totalAmount > 0) {
      balance = this.roundCurrency(
        Math.min(requestedBalance, userBalance, totalAmount),
      );
    }

    const unpaidAmount = this.roundCurrency(Math.max(totalAmount - balance, 0));

    // 构建配送选项（对齐 PHP 返回结构但保持驼峰）
    const deliveryOption = await this.buildDeliveryOption(shops);

    return {
      productAmount,
      checkedCount: totals.checkedCount ?? 0,
      discounts,
      discountAfter, // 若需要对齐 PHP 在无折扣时返回 null，可在此加: discountAfter: discounts>0?discountAfter:null
      totalCount: totals.totalCount ?? totals.checkedCount ?? 0,
      discountCouponAmount: couponAmount,
      discountDiscountAmount: discountAmount,
      discountSeckillAmount,
      discountProductPromotionAmount,
      discountTimeDiscountAmount,
      serviceFee,
      shippingFee,
  storeShippingFee: storeShippingFeeList,
  storeShippingFeeMap,
      couponAmount,
      discountAmount,
      totalAmount,
      unpaidAmount,
      paidAmount: 0,
      pointsAmount,
      usePoint,
      exchangePoints: 0,
      orderSendPoint: 0,
      couponIds: Array.isArray(this.checkoutParams?.use_coupon_ids)
        ? this.checkoutParams.use_coupon_ids
        : [],
      balance,
      deliveryOption,
    };
  }

  /**
   * 依据当前选中的优惠券计算抵扣金额
   */
  private async calculateSelectedCouponsAmount(shops: CheckoutShop[]) {
    const userId = Number(this.checkoutParams?.user_id ?? 0);
    const useCouponIds: number[] = Array.isArray(this.checkoutParams?.use_coupon_ids)
      ? this.checkoutParams.use_coupon_ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)
      : [];
    const selectUserCouponIds: number[] = Array.isArray(this.checkoutParams?.select_user_coupon_ids)
      ? this.checkoutParams.select_user_coupon_ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)
      : [];

    if (userId <= 0 || shops.length === 0 || (useCouponIds.length === 0 && selectUserCouponIds.length === 0)) {
      return { totalAmount: 0, perShop: new Map<number, number>() };
    }

    // 统计每个店铺及全局的商品金额和商品ID清单
    const shopSummary = new Map<
      number,
      { amount: number; productIds: number[]; productAmountMap: Map<number, number> }
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

    // 读取选中的用户优惠券
    const nowTs = Math.floor(Date.now() / 1000);
    const userCoupons = await this.prisma.user_coupon.findMany({
      where: {
        user_id: userId,
        used_time: 0,
        order_id: 0,
        start_date: { lte: nowTs },
        end_date: { gte: nowTs },
        OR: [
          selectUserCouponIds.length > 0 ? { id: { in: selectUserCouponIds } } : undefined,
          useCouponIds.length > 0 ? { coupon_id: { in: useCouponIds } } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (userCoupons.length === 0) {
      return { totalAmount: 0, perShop: new Map<number, number>() };
    }

    const couponIds = userCoupons
      .map((uc) => Number(uc.coupon_id ?? 0))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (couponIds.length === 0) {
      return { totalAmount: 0, perShop: new Map<number, number>() };
    }

    const couponRecords = await this.prisma.coupon.findMany({
      where: {
        coupon_id: { in: couponIds },
      },
    });
    const couponMap = new Map<number, any>();
    for (const c of couponRecords) {
      couponMap.set(Number(c.coupon_id), c);
    }

    let totalAmount = 0;
    const perShop = new Map<number, number>();

    for (const uc of userCoupons) {
      const couponId = Number(uc.coupon_id ?? 0);
      if (!useCouponIds.includes(couponId)) continue; // 仅计算用户当前选择的优惠券
      const coupon = couponMap.get(couponId);
      if (!coupon) continue;

      const isGlobal = Number(coupon.is_global ?? 0) === 1;
      const shopId = Number(coupon.shop_id ?? 0);
      const shopInfo = shopSummary.get(shopId);
      const sendRange = Number(coupon.send_range ?? 0);
      const sendRangeData = this.parseCouponRangeData(coupon.send_range_data ?? []);
      const minOrderAmount = this.toNumber(coupon.min_order_amount ?? 0);

      // 计算作用范围金额与商品集合
      let scopeAmount = 0;
      let scopeProductIds: number[] = [];
      let scopeProductAmountMap = new Map<number, number>();

      if (isGlobal) {
        scopeAmount = totalProductAmount;
        // 合并所有店铺商品
        const idsSet = new Set<number>();
        for (const entry of shopSummary.values()) {
          entry.productIds.forEach((pid) => idsSet.add(pid));
          for (const [pid, sub] of entry.productAmountMap.entries()) {
            scopeProductAmountMap.set(pid, (scopeProductAmountMap.get(pid) ?? 0) + sub);
          }
        }
        scopeProductIds = Array.from(idsSet.values());
      } else {
        scopeAmount = shopInfo?.amount ?? 0;
        scopeProductIds = shopInfo?.productIds ?? [];
        scopeProductAmountMap = shopInfo?.productAmountMap ?? new Map<number, number>();
      }

      // sendRange: 3 指定商品可用，4 排除指定商品
      let applicableAmount = scopeAmount;
      if (sendRange === 3) {
        const intersection = scopeProductIds.filter((id) => sendRangeData.includes(id));
        applicableAmount = intersection.reduce((sum, pid) => sum + (scopeProductAmountMap.get(pid) ?? 0), 0);
      }
      if (sendRange === 4) {
        const remaining = scopeProductIds.filter((id) => !sendRangeData.includes(id));
        applicableAmount = remaining.reduce((sum, pid) => sum + (scopeProductAmountMap.get(pid) ?? 0), 0);
      }

      if (applicableAmount <= 0 || applicableAmount < minOrderAmount) {
        continue;
      }

      // 计算抵扣金额：coupon_type 1 面额券，2 折扣券
      const couponType = Number(coupon.coupon_type ?? 1);
      let deduction = 0;
      if (couponType === 1) {
        const face = this.toNumber(coupon.coupon_money ?? 0);
        deduction = Math.min(face, applicableAmount);
      } else if (couponType === 2) {
        const discount = this.toNumber(coupon.coupon_discount ?? 10);
        const factor = Math.min(Math.max(discount / 10, 0), 1); // 9.5折 -> 0.95
        const after = this.roundCurrency(applicableAmount * factor);
        deduction = this.roundCurrency(applicableAmount - after);
      }

      if (deduction > 0) {
        totalAmount += deduction;
        const keyShopId = isGlobal ? 0 : shopId;
        perShop.set(keyShopId, this.roundCurrency((perShop.get(keyShopId) ?? 0) + deduction));
      }
    }

    return { totalAmount: this.roundCurrency(totalAmount), perShop };
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

    const numericBalance = this.toNumber(user.balance ?? 0);

    if (!Number.isFinite(numericBalance) || numericBalance <= 0) {
      return 0;
    }

    return this.roundCurrency(numericBalance);
  }

  /**
   * 获取用户积分
   */
  async getUserPoints(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { points: true },
    });

    const points = this.toNumber(user?.points ?? 0);

    return points > 0 ? Math.floor(points) : 0;
  }

  /**
   * 获取订单可用积分
   */
  async getOrderAvailablePoints() {
    const userId = Number(this.checkoutParams?.user_id ?? 0);
    if (userId <= 0) {
      return 0;
    }

    const flowType = Number(this.checkoutParams?.flow_type ?? 1);
    const cartData = await this.getStoreCarts(userId, flowType);
    const productAmount = this.roundCurrency(
      cartData?.total?.productAmount ?? 0,
    );

    return this.calculateAvailablePoints(productAmount, userId);
  }

  private async calculateAvailablePoints(
    productAmount: number,
    userId: number,
  ): Promise<number> {
    const integralScale = await this.getIntegralScale();
    if (integralScale <= 0 || productAmount <= 0) {
      return 0;
    }

    const userPoints = await this.getUserPoints(userId);
    if (userPoints <= 0) {
      return 0;
    }

    const maxPoints = Math.floor((productAmount / integralScale) * 100);
    if (maxPoints <= 0) {
      return 0;
    }

    return Math.min(userPoints, maxPoints);
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
    const userId = Number(this.checkoutParams?.user_id ?? 0);
    if (userId <= 0) {
      throw new HttpException("请先登录", HttpStatus.UNAUTHORIZED);
    }

    // 1) 获取购物车（仅已选中项）并构建促销
    const flowType = Number(this.checkoutParams?.flow_type ?? 1);
    const cartSource = await this.getStoreCarts(userId, flowType);
    if (!cartSource?.carts || cartSource.carts.length === 0) {
      throw new HttpException("您还未选择商品！", HttpStatus.BAD_REQUEST);
    }
    const builtCart = await this.buildCartPromotion(
      cartSource,
      userId,
      flowType,
      0,
      this.checkoutParams.use_coupon_ids ?? [],
    );

    // 2) 计算总计
    const totals = await this.getTotalFee(builtCart);

    // 3) 读取地址（使用传入或当前选中的地址；若无则报错）
    const addressId = Number(this.checkoutParams?.address_id ?? 0);
    const addr = await this.getSelectedOrDefaultAddressRaw(userId, addressId);
    if (!addr) {
      throw new HttpException("请先选择收货地址", HttpStatus.BAD_REQUEST);
    }

    // 4) 生成订单基础字段
    const now = Math.floor(Date.now() / 1000);
    const orderSn = `ORDER${now}${Math.floor(Math.random() * 1000)}`;
    const shippingType = Array.isArray(this.checkoutParams?.shipping_type)
      ? this.checkoutParams.shipping_type[0]
      : null;
    const shippingTypeId = Number(shippingType?.typeId ?? 1);
    const shippingTypeName = String(shippingType?.typeName ?? "普通快递");
    const payTypeId = Number(this.checkoutParams?.pay_type_id ?? 1);

    // 5) 开启事务：写入订单、订单商品、券使用、扣积分/余额、清除购物车
    const result = await this.prisma.$transaction(async (tx) => {
      // 5.1 创建订单
      // 解析客户端来源，对齐 PHP \utils\Util::getClientType()
      const clientType = this.detectClientType();
      const order = await tx.order.create({
        data: {
          order_sn: orderSn,
          user_id: userId,
          order_status: 0,
          pay_status: 0,
          shipping_status: 0,
          add_time: now,
          consignee: String(addr.consignee ?? ""),
          address: String(addr.address ?? ""),
          region_ids: String(addr.region_ids ?? ""),
          region_names: String(addr.region_names ?? ""),
          mobile: String(addr.mobile ?? ""),
          email: String(addr.email ?? ""),
          shipping_method: 1,
          logistics_id: 0,
          logistics_name: "",
          shipping_type_id: shippingTypeId,
          shipping_type_name: shippingTypeName,
          pay_type_id: payTypeId,
          // 金额类字段
          product_amount: totals.productAmount,
          service_fee: totals.serviceFee,
          shipping_fee: totals.shippingFee,
          coupon_amount: totals.couponAmount,
          discount_amount: totals.discountAmount ?? totals.discounts ?? 0,
          points_amount: totals.pointsAmount,
          balance: totals.balance,
          total_amount: totals.totalAmount,
          unpaid_amount: totals.unpaidAmount,
          paid_amount: 0,
          order_extension: "",
          order_source: clientType,
          address_data: JSON.stringify({
            addressId: addr.address_id,
            consignee: addr.consignee,
            regionIds: addr.region_ids,
            regionNames: addr.region_names,
            address: addr.address,
            mobile: addr.mobile,
            email: addr.email ?? "",
          }),
        },
      });

      // 5.2 创建订单商品
      const orderItemsData = [] as any[];
      for (const shop of builtCart.cartList ?? []) {
        for (const item of shop.carts ?? []) {
          // 过滤未选中的，以防万一
          const checked = this.isCartItemChecked(item);
          if (!checked) continue;
          const price = this.toNumber(item?.originPrice ?? item?.price ?? 0);
          const quantity = this.toNumber(item?.quantity ?? 0);
          orderItemsData.push({
            order_id: order.order_id,
            order_sn: order.order_sn,
            user_id: userId,
            price,
            quantity,
            product_id: Number(item?.productId ?? 0),
            product_name: String(item?.productName ?? ""),
            product_sn: String(item?.productSn ?? ""),
            pic_thumb: String(item?.picThumb ?? ""),
            sku_id: Number(item?.skuId ?? 0),
            sku_data: JSON.stringify(item?.skuData ?? []),
            delivery_quantity: 0,
            product_type: Number(item?.productType ?? 1),
            is_gift: 0,
            shop_id: Number(item?.shopId ?? 0),
            is_pin: 0,
            origin_price: price,
            promotion_data: "",
            is_seckill: 0,
            extra_sku_data: JSON.stringify(item?.extraSkuData ?? []),
            suppliers_id: item?.suppliersId ?? 0,
            card_group_name: "",
            vendor_product_id: item?.vendorProductId ?? null,
            vendor_product_sku_id: item?.vendorProductSkuId ?? null,
            vendor_id: item?.vendorId ?? null,
          });
        }
      }
      if (orderItemsData.length > 0) {
        await tx.order_item.createMany({ data: orderItemsData });
      }

      // 5.2.1 扣减库存并记录库存变更日志（对齐 PHP：下单扣减库存）
      const decTs = Math.floor(Date.now() / 1000);
      for (const shop of builtCart.cartList ?? []) {
        for (const item of shop.carts ?? []) {
          const checked = this.isCartItemChecked(item);
          if (!checked) continue;
          const isGift = Number(item?.is_gift ?? 0) === 1;
          const quantity = this.toNumber(item?.quantity ?? 0);
          if (quantity <= 0) continue;
          // 赠品扣赠品库存，普通商品扣商品/规格库存
          const productId = Number(item?.productId ?? 0);
          const skuId = Number(item?.skuId ?? 0);
          const shopId = Number(item?.shopId ?? 0);

          if (isGift) {
            // 赠品库存扣减（如果有 giftId 可在此扩展到赠品表，目前仅扣商品库存作为保底）
            if (productId > 0) {
              const prod = await tx.product.findFirst({ where: { product_id: productId }, select: { product_stock: true } });
              if (prod) {
                const oldNum = this.toNumber(prod.product_stock ?? 0);
                const newNum = Math.max(oldNum - quantity, 0);
                if (newNum !== oldNum) {
                  await tx.product.updateMany({ where: { product_id: productId }, data: { product_stock: newNum } });
                  await tx.product_inventory_log.create({
                    data: {
                      product_id: productId,
                      spec_id: 0,
                      number: Math.abs(newNum - oldNum),
                      add_time: decTs,
                      old_number: oldNum,
                      // type: false 表示扣减（schema 中为 Boolean）
                      type: false as any,
                      change_number: quantity,
                      desc: "下单扣减库存",
                      shop_id: shopId,
                    },
                  });
                }
              }
            }
            continue;
          }

          if (skuId > 0) {
            // 减 SKU 库存，同时减商品总库存
            const sku = await tx.product_sku.findUnique({ where: { sku_id: skuId }, select: { sku_stock: true, product_id: true } });
            if (sku) {
              const oldSkuNum = this.toNumber(sku.sku_stock ?? 0);
              const newSkuNum = Math.max(oldSkuNum - quantity, 0);
              if (newSkuNum !== oldSkuNum) {
                await tx.product_sku.update({ where: { sku_id: skuId }, data: { sku_stock: newSkuNum } });
              }
              const pId = Number(sku.product_id ?? productId ?? 0);
              if (pId > 0) {
                const prod = await tx.product.findFirst({ where: { product_id: pId }, select: { product_stock: true } });
                if (prod) {
                  const oldProdNum = this.toNumber(prod.product_stock ?? 0);
                  const newProdNum = Math.max(oldProdNum - quantity, 0);
                  if (newProdNum !== oldProdNum) {
                    await tx.product.updateMany({ where: { product_id: pId }, data: { product_stock: newProdNum } });
                  }
                  await tx.product_inventory_log.create({
                    data: {
                      product_id: pId,
                      spec_id: skuId,
                      number: Math.abs(newSkuNum - oldSkuNum) || Math.min(quantity, oldSkuNum),
                      add_time: decTs,
                      old_number: oldSkuNum,
                      type: false as any,
                      change_number: quantity,
                      desc: "下单扣减库存",
                      shop_id: shopId,
                    },
                  });
                }
              }
            }
          } else if (productId > 0) {
            // 仅减商品总库存
            const prod = await tx.product.findFirst({ where: { product_id: productId }, select: { product_stock: true } });
            if (prod) {
              const oldNum = this.toNumber(prod.product_stock ?? 0);
              const newNum = Math.max(oldNum - quantity, 0);
              if (newNum !== oldNum) {
                await tx.product.updateMany({ where: { product_id: productId }, data: { product_stock: newNum } });
                await tx.product_inventory_log.create({
                  data: {
                    product_id: productId,
                    spec_id: 0,
                    number: Math.abs(newNum - oldNum),
                    add_time: decTs,
                    old_number: oldNum,
                    type: false as any,
                    change_number: quantity,
                    desc: "下单扣减库存",
                    shop_id: shopId,
                  },
                });
              }
            }
          }
        }
      }

      // 5.3 标记优惠券已用（若有）
      const selectedUserCouponIds: number[] = Array.isArray(this.checkoutParams?.select_user_coupon_ids)
        ? this.checkoutParams.select_user_coupon_ids
            .map((id) => Number(id))
            .filter((n) => Number.isFinite(n) && n > 0)
        : [];
      if (selectedUserCouponIds.length > 0) {
        await tx.user_coupon.updateMany({
          where: { id: { in: selectedUserCouponIds }, user_id: userId },
          data: { used_time: now, order_id: order.order_id },
        });
        // 记录订单-优惠券明细
        const couponIds = Array.isArray(this.checkoutParams?.use_coupon_ids)
          ? this.checkoutParams.use_coupon_ids
              .map((id) => Number(id))
              .filter((n) => Number.isFinite(n) && n > 0)
          : [];
        const couponDetails = couponIds.map((cid) => ({
          order_id: order.order_id,
          shop_id: 0,
          coupon_id: cid,
          coupon_fee: 0,
        }));
        if (couponDetails.length > 0) {
          await tx.order_coupon_detail.createMany({ data: couponDetails });
        }
      }

      // 5.4 扣余额与积分（若有）
      if ((totals.balance ?? 0) > 0) {
        const user = await tx.user.findUnique({ where: { user_id: userId }, select: { balance: true } });
        const current = this.toNumber(user?.balance ?? 0);
        const next = Math.max(current - this.toNumber(totals.balance, 0), 0);
        await tx.user.update({ where: { user_id: userId }, data: { balance: next } });
      }
      if ((totals.usePoint ?? 0) > 0) {
        const user = await tx.user.findUnique({ where: { user_id: userId }, select: { points: true } });
        const current = this.toNumber(user?.points ?? 0);
        const next = Math.max(current - this.toNumber(totals.usePoint, 0), 0);
        await tx.user.update({ where: { user_id: userId }, data: { points: next } });
      }

      // 5.5 删除勾选的购物车项
      await tx.cart.deleteMany({ where: { user_id: userId, is_checked: 1 } });

      // 5.6 若未付款金额为 0，则直接标记订单为已支付（对齐 PHP 行为）
      if (Number(totals.unpaidAmount ?? 0) <= 0) {
        const paidAmount = Number(order.total_amount ?? totals.totalAmount ?? 0);
        await tx.order.update({
          where: { order_id: order.order_id },
          data: {
            // 同时将订单状态置为已确认，避免出现“待支付/待发货”并存
            order_status: 1,
            pay_status: 1,
            paid_amount: paidAmount as any,
            unpaid_amount: 0 as any,
            pay_time: now,
          },
        });
      }

      return order;
    });

    return {
      order_id: result.order_id,
      unpaid_amount: Number(totals.unpaidAmount ?? 0),
    };
  }

  // 根据请求上下文推断客户端类型（需在 controller 调用前注入 request 到 checkoutParams._req 或者在构造器中传入）
  private detectClientType(): string {
    const req: any = (this as any).request || this.checkoutParams?._req;
    // 复用公共解析
    const { resolveClientType } = require('../common/utils/../../common/utils/client-type.util');
    return resolveClientType(req) || 'h5';
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

  /**
   * 获取用户所选或默认地址（原始DB记录，用于下单持久化）
   */
  private async getSelectedOrDefaultAddressRaw(userId: number, addressId?: number) {
    if (addressId && addressId > 0) {
      const rec = await this.prisma.user_address.findFirst({
        where: { user_id: userId, address_id: addressId },
      });
      if (rec) return rec;
    }
    // 尝试获取当前选中地址
    const selected = await this.prisma.user_address.findFirst({
      where: { user_id: userId, is_selected: 1 },
      orderBy: [{ address_id: "desc" }],
    });
    if (selected) return selected;
    // 再尝试默认地址
    const def = await this.prisma.user_address.findFirst({
      where: { user_id: userId, is_default: 1 },
      orderBy: [{ address_id: "desc" }],
    });
    return def;
  }

  private async getPointValueAmount(point: number): Promise<number> {
    if (point <= 0) return 0;
    const scale = await this.getIntegralScale();
    if (scale <= 0) return 0;
    return this.roundCurrency((point / 100) * scale);
  }

  private async getIntegralScale(): Promise<number> {
    if (this.integralScaleCache !== null) {
      return this.integralScaleCache;
    }
    const raw = await this.getConfigValue("integralScale", "0");
    const val = this.toNumber(raw, 0);
    this.integralScaleCache = val > 0 ? val : 0;
    return this.integralScaleCache;
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

  private async calculateShippingFee(shops: CheckoutShop[]): Promise<ShippingFeeResult> {
    // NOTE: 为保持与 PHP 行为一致，整合三层逻辑：
    // 1. 跳过全虚拟 / 全包邮组
    // 2. 固定运费 (fixedShippingFee > 0) 直接叠加
    // 3. 模板运费：按 shop -> shipping_tpl_id 聚合 count / weight，按所选配送方式 shipping_type 匹配模板行，再计算（件/重量）增量费用
    const perShop = new Map<number, number>();
    if (!Array.isArray(shops) || shops.length === 0) {
      return { total: 0, storeShippingFee: perShop };
    }

    // 预处理：收集所有涉及的模板 ID 与需要的配送类型（shipping_type 选中）
    const templateIdSet = new Set<number>();
    const shopSelectedType = new Map<number, number>(); // shopId -> typeId
    // 获取用户提交的 shipping_type 选择（保存在 this.checkoutParams.shipping_type）
    for (const sel of (this.checkoutParams?.shipping_type || [])) {
      if (sel && typeof sel.shopId === "number") {
        shopSelectedType.set(Number(sel.shopId), Number(sel.typeId || sel.type_id || sel.typeID || 0));
      }
    }

    // 聚合结构：shopId -> tplId -> { count, weight, freeSkip }
    const aggregate: Record<number, Record<number, { count: number; weight: number; fee: number }>> = {};

    for (const shop of shops) {
      const shopId = Number(shop?.shopId ?? 0);
      if (!perShop.has(shopId)) perShop.set(shopId, 0);
      const freeShippingAll = (shop as any)?.freeShippingAll === 1;
      if (Number(shop?.noShipping ?? 0) === 1 || freeShippingAll) {
        // 全虚拟或全包邮，跳过；仍保留 perShop=0
        continue;
      }

      // 固定运费先加
      const fixed = this.toNumber(shop?.fixedShippingFee ?? 0);
      if (fixed > 0) {
        perShop.set(shopId, this.roundCurrency((perShop.get(shopId) ?? 0) + fixed));
        continue; // 有固定运费时，按当前实现直接覆盖，不再走模板聚合（如需叠加可移除此 continue）
      }

      // 模板聚合
      for (const cartItem of (shop?.carts || [])) {
        const isChecked = this.isCartItemChecked(cartItem);
        if (!isChecked) continue; // 只对选中项计费
        const freeShipping = Number(cartItem?.freeShipping ?? cartItem?.free_shipping ?? 0) === 1;
        const tplIdRaw = Number(cartItem?.shippingTplId ?? cartItem?.shipping_tpl_id ?? 0);
        const tplId = tplIdRaw > 0 ? tplIdRaw : 0; // 0 也允许，用于找默认模板
        templateIdSet.add(tplId);
        if (!aggregate[shopId]) aggregate[shopId] = {};
        if (!aggregate[shopId][tplId]) {
          aggregate[shopId][tplId] = { count: 0, weight: 0, fee: 0 };
        }
        if (!freeShipping) {
          // 不统计包邮商品
            const qty = this.toNumber(cartItem?.quantity ?? 0);
            const weight = this.toNumber(cartItem?.productWeight ?? cartItem?.product_weight ?? 0) * qty;
            aggregate[shopId][tplId].count += qty;
            aggregate[shopId][tplId].weight += weight;
        }
      }
    }

    // 若没有需要模板计费的内容，直接汇总返回
    if (Object.keys(aggregate).length === 0) {
      let simpleTotal = 0;
      for (const v of perShop.values()) simpleTotal += v;
      return { total: this.roundCurrency(simpleTotal), storeShippingFee: perShop };
    }

    // 查询所需模板行 shipping_tpl_info（一次性取出）
    // 选中配送方式：shipping_type_id = shopSelectedType[shopId]；若为空则默认 1
    // 这里简化：一次性查询所有相关 tplId 与所有可能 typeId（收集）
    const uniqueTypeIds = new Set<number>();
    for (const [sid, tid] of shopSelectedType.entries()) uniqueTypeIds.add(tid || 0);
    if (uniqueTypeIds.size === 0) uniqueTypeIds.add(0);

    // 取全部涉及 tpl 的所有 info 行（后续用内存过滤）
    const tplIdsArray = Array.from(templateIdSet.values());
    const infoRows: any[] = tplIdsArray.length
      ? await (this.prisma as any).$queryRawUnsafe(
          `SELECT id, shipping_type_id, shipping_tpl_id, is_free, is_default, region_data, start_number, start_price, add_number, add_price, pricing_type, free_price
           FROM \`shipping_tpl_info\`
           WHERE shipping_tpl_id IN (${tplIdsArray.map(() => '?').join(',')})
           LIMIT 10000`,
          ...tplIdsArray,
        )
      : [];

    // region id 链：从 checkoutParams/address 推导；简单起见，仅使用用户地址 regionIds（已在 earlier 逻辑中应该获取），若没有就空
    // 这里做一个兜底：尝试获取用户默认地址 regionIds；若不可得则 regionIds=[]
    let regionIds: number[] = [];
    try {
      if (this.checkoutParams?.address_id) {
        const addr = await this.prisma.user_address.findFirst({
          where: { address_id: this.checkoutParams.address_id },
          select: { province: true, city: true, district: true },
        });
        if (addr) {
          regionIds = [addr.province, addr.city, addr.district].filter((x) => Number(x) > 0) as number[];
        }
      }
    } catch {}

    const pickRegionMatch = (rows: any[], typeId: number, tplId: number) => {
      const subset = rows.filter((r) => Number(r.shipping_tpl_id) === tplId && Number(r.shipping_type_id) === typeId);
      if (!subset.length) return null;
      let fallback: any = null;
      for (const r of subset) {
        if (Number(r.is_default) === 1) fallback = r;
      }
      // 逐行匹配区域；region_data 可能是 JSON，需解析 areaRegions
      for (const r of subset) {
        if (!r.region_data) continue;
        try {
          const parsed = typeof r.region_data === 'string' ? JSON.parse(r.region_data) : r.region_data;
          const areaRegions: number[] = parsed?.areaRegions || parsed?.area_regions || [];
          if (Array.isArray(areaRegions) && areaRegions.some((rid) => regionIds.includes(Number(rid)))) {
            return r; // 优先区域匹配
          }
        } catch {}
      }
      return fallback || subset[0];
    };

    // 计算模板费用
    for (const [shopIdStr, tplMap] of Object.entries(aggregate)) {
      const shopId = Number(shopIdStr);
      if (!tplMap) continue;
      const typeId = shopSelectedType.get(shopId) || 0; // 0 代表默认普通快递，PHP 中常用 1，这里保持 0->1 兼容
      const effTypeId = typeId || 1;
      for (const [tplIdStr, agg] of Object.entries(tplMap)) {
        const tplId = Number(tplIdStr);
        // 匹配模板 info 行
        const tplInfo = pickRegionMatch(infoRows, effTypeId, tplId);
        if (!tplInfo) continue; // 没有规则 -> 视为 0

        const startPrice = this.toNumber(tplInfo.start_price ?? 0);
        const startNumber = this.toNumber(tplInfo.start_number ?? 0);
        const addNumber = this.toNumber(tplInfo.add_number ?? 0);
        const addPrice = this.toNumber(tplInfo.add_price ?? 0);
        const pricingType = this.toNumber(tplInfo.pricing_type ?? 1); // 1=件,2=重量
        const isFree = Number(tplInfo.is_free ?? 0) === 1;
        const freePrice = this.toNumber(tplInfo.free_price ?? 0); // 满额包邮

        let fee = 0;
        if (agg.count <= 0 && agg.weight <= 0) {
          fee = 0;
        } else if (isFree || (this.toNumber((shops as any)?.productAmount ?? 0) >= freePrice && freePrice > 0)) {
          fee = 0;
        } else {
          fee = startPrice;
          if (pricingType === 1) {
            // 按件
            const remain = agg.count - startNumber;
            if (remain > 0 && addNumber > 0 && addPrice > 0) {
              const blocks = Math.trunc(remain / addNumber); // 不四舍五入
              fee += blocks * addPrice;
            }
          } else if (pricingType === 2) {
            // 按重量
            const remainW = agg.weight - startNumber;
            if (remainW > 0 && addNumber > 0 && addPrice > 0) {
              const blocks = Math.trunc(remainW / addNumber) + 1; // PHP 逻辑 +1
              fee += blocks * addPrice;
            }
          }
        }
        if (fee > 0) {
          perShop.set(shopId, this.roundCurrency((perShop.get(shopId) ?? 0) + fee));
        }
      }
    }

    // 汇总 total
    let total = 0;
    for (const v of perShop.values()) total += v;
    return { total: this.roundCurrency(total), storeShippingFee: perShop };
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
