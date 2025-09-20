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
    const userCoupon = await this.prisma.userCoupon.findFirst({
      where: {
        user_id: userId,
        coupon_id: couponId,
        status: 0, // 未使用
      },
    });

    return userCoupon?.user_coupon_id || 0;
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
    return this.prisma.userAddress.findMany({
      where: { user_id: userId },
      orderBy: [{ is_default: "desc" }, { address_id: "desc" }],
    });
  }

  /**
   * 获取可用支付方式
   */
  async getAvailablePaymentType() {
    return [
      { id: "wechat", name: "微信支付", status: 1 },
      { id: "alipay", name: "支付宝", status: 1 },
      { id: "balance", name: "余额支付", status: 1 },
      { id: "offline", name: "线下支付", status: 0 },
    ];
  }

  /**
   * 获取店铺配送方式
   */
  async getStoreShippingType(flowType?: number) {
    return [
      {
        shop_id: 1,
        shipping_list: [
          {
            id: "express",
            name: "快递配送",
            price: 10,
            description: "全国配送",
          },
          { id: "pickup", name: "到店自提", price: 0, description: "到店自提" },
        ],
      },
    ];
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
      select: { user_money: true },
    });

    return user?.user_money || 0;
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
}
