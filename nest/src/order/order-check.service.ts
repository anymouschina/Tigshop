// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrderCheckService {
  private checkoutParams: any = {};

  constructor(private prisma: PrismaService) {}

  /**
   * 检查用户企业认证
   */
  async checkUserCompanyAuth(userId: number) {
    // 模拟B2B模式下的用户企业认证检查
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new HttpException("用户不存在", HttpStatus.NOT_FOUND);
    }

    // 这里可以添加B2B模式的认证逻辑
    return true;
  }

  /**
   * 获取店铺购物车
   */
  async getStoreCarts(selectIds: string, flowType: number) {
    // 模拟获取购物车数据
    return {
      carts: [
        {
          shop_id: 1,
          shop_name: "默认店铺",
          items: [
            {
              cart_id: 1,
              product_id: 1,
              product_name: "测试商品",
              product_image: "/images/product1.jpg",
              product_price: 99.99,
              quantity: 1,
              sku_data: "{}",
            },
          ],
        },
      ],
    };
  }

  /**
   * 构建购物车促销信息
   */
  async buildCartPromotion(
    cartList: any,
    userId: number,
    flowType: number,
    useDefaultCoupon: number = 0,
    useCouponIds: number[] = [],
  ) {
    // 模拟构建购物车促销信息
    return {
      carts: cartList.carts.map((shop) => ({
        ...shop,
        used_promotions: [],
        promotion_discount: 0,
        total_amount: shop.items.reduce(
          (sum, item) => sum + item.product_price * item.quantity,
          0,
        ),
      })),
    };
  }

  /**
   * 根据优惠券ID获取用户优惠券ID
   */
  async getUserCouponIdByCouponId(userId: number, couponId: number) {
    const userCoupon = await (this.prisma as any).user_coupon.findFirst({
      where: {
        user_id: userId,
        coupon_id: couponId,
        status: 0, // 未使用
      },
    });

    return userCoupon?.id || 0;
  }

  /**
   * 初始化结算参数
   */
  async initSet(params: any) {
    this.checkoutParams = { ...params };
  }

  /**
   * 获取用户地址列表
   */
  async getAddressList(userId: number) {
    const records = await (this.prisma as any).user_address.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_selected: "desc" },
        { is_default: "desc" },
        { address_id: "desc" },
      ],
    });

    return records.map((record: any) => this.transformAddress(record));
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
        shippingTypeId: info.shippingTypeId,
        shopId,
        shippingTypeName: info.shippingTypeName,
      },
    ]);
  }

  /**
   * 获取订单总费用
   */
  async getTotalFee(cartList: any) {
    let totalAmount = 0;
    let shippingFee = 0;
    let discountAmount = 0;

    for (const shop of cartList.carts) {
      totalAmount += shop.total_amount || 0;
      discountAmount += shop.promotion_discount || 0;
    }

    // 计算运费
    if (totalAmount < 99) {
      shippingFee = 10;
    }

    const finalAmount = totalAmount - discountAmount + shippingFee;

    return {
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      final_amount: finalAmount,
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
    // 模拟获取可用优惠券
    return [
      {
        coupon_id: 1,
        coupon_name: "新用户优惠券",
        coupon_money: 10,
        use_start_time: new Date(),
        use_end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_use: useCouponIds.includes(1),
        user_coupon_id: 1,
      },
    ];
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

  private transformAddress(address: any) {
    if (!address) {
      return address;
    }

    const regionIds = address.region_ids
      ? String(address.region_ids)
          .split(",")
          .map((part: string) => Number(part))
          .filter((num: number) => Number.isFinite(num))
      : [];
    const regionNames = address.region_names
      ? String(address.region_names)
          .split(",")
          .map((part: string) => part.trim())
          .filter((part: string) => part.length > 0)
      : [];

    const isDefault = Number(address.is_default ?? 0) === 1 ? 1 : 0;
    const isSelected = Number(address.is_selected ?? 0) === 1 ? 1 : 0;

    return {
      regionName: regionNames.filter((name) => !!name).join(" ").trim(),
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
    };
  }
}
