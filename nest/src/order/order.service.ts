// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CartService } from "../cart/cart.service";

export interface CreateOrderDto {
  addressId: number;
  couponId?: number;
  remark?: string;
  paymentMethod: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  /**
   * 创建订单
   * @param userId 用户ID
   * @param createOrderDto 订单数据
   * @returns 创建的订单
   */
  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const { addressId, couponId, remark, paymentMethod } = createOrderDto;

    // 获取用户购物车
    const cart = await this.cartService.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException("购物车为空，无法创建订单");
    }

    // 获取用户地址
    const address = await this.prisma.userAddress.findUnique({
      where: { addressId: addressId },
    });

    if (!address) {
      throw new BadRequestException("收货地址不存在");
    }

    // 验证库存
    for (const item of cart.items) {
      const product = await this.prisma.product.findUnique({
        where: { productId: item.productId },
      });

      if (!product || product.isDelete !== 0) {
        throw new BadRequestException(`商品 ${item.productId} 已下架`);
      }

      if (product.productStock < item.quantity) {
        throw new BadRequestException(`商品 ${item.productId} 库存不足`);
      }
    }

    // 计算订单金额
    const totalAmount = cart.totalPrice;
    let discountAmount = 0;
    const shippingFee = this.calculateShippingFee(cart.items);

    // 处理优惠券
    if (couponId) {
      const coupon = await this.prisma.userCoupon.findUnique({
        where: { id: couponId },
        include: { coupon: true },
      });

      if (!coupon || coupon.usedTime !== null) {
        throw new BadRequestException("优惠券不可用");
      }

      const now = new Date();
      if (coupon.coupon.useStartDate > now || coupon.coupon.useEndDate < now) {
        throw new BadRequestException("优惠券已过期");
      }

      if (totalAmount < Number(coupon.coupon.minOrderAmount || 0)) {
        throw new BadRequestException(
          `订单金额未达到优惠券使用门槛: ${coupon.coupon.minOrderAmount}`,
        );
      }

      if (coupon.coupon.couponType === 1) {
        // 固定金额
        discountAmount = Number(coupon.coupon.couponMoney);
      } else if (coupon.coupon.couponType === 2) {
        // 百分比
        discountAmount =
          (totalAmount * Number(coupon.coupon.couponDiscount)) / 100;
      }

      // 优惠金额不能超过订单金额
      discountAmount = Math.min(discountAmount, totalAmount);
    }

    const paymentAmount = totalAmount - discountAmount + shippingFee;

    // 生成订单号
    const orderSn = this.generateOrderSn();

    // 开启事务
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建订单 - 使用原始SQL来避免XOR类型问题
      const order = (await tx.$queryRaw`
        INSERT INTO "Order" (
          "userId", "orderSn", "totalAmount", "discountAmount", "shippingFee",
          "paymentAmount", "paymentMethod", "remark", "status", "paymentStatus",
          "shippingStatus", "createdAt", "updatedAt"
        ) VALUES (
          ${userId}, ${orderSn}, ${totalAmount}, ${discountAmount}, ${shippingFee},
          ${paymentAmount}, ${paymentMethod}, ${remark}, 'PENDING', 'UNPAID',
          'UNSHIPPED', ${new Date()}, ${new Date()}
        )
        RETURNING *
      `) as any;

      // 获取创建的订单ID
      const orderId = (order as any)[0].orderId;

      // 订单地址信息已直接存储在Order表中，无需单独创建

      // 创建订单项 - 使用原始SQL避免XOR类型问题
      for (const item of cart.items) {
        await tx.$queryRaw`
          INSERT INTO "OrderItem" (
            "orderId", "productId", "quantity", "price", "productName", "picThumb"
          ) VALUES (
            ${orderId}, ${item.productId}, ${item.quantity}, ${item.originalPrice}, ${item.productSn || ""}, ${item.picThumb || ""}
          )
        `;

        // 扣减库存
        await tx.product.update({
          where: { productId: item.productId },
          data: {
            productStock: {
              decrement: item.quantity,
            },
            clickCount: {
              increment: item.quantity,
            },
          },
        });
      }

      // 使用优惠券
      if (couponId) {
        await tx.userCoupon.update({
          where: { id: couponId },
          data: {
            usedTime: new Date(),
          },
        });
      }

      // 清空购物车
      await tx.cart.deleteMany({
        where: {
          userId,
          isChecked: 1, // 只清空选中的商品
        },
      });

      return { orderId };
    });

    return this.getOrderDetail(result.orderId);
  }

  /**
   * 获取订单列表
   * @param userId 用户ID
   * @param query 查询参数
   * @returns 订单列表
   */
  async getOrderList(userId: number, query: any = {}) {
    const { page = 1, size = 10, status, paymentStatus, keyword } = query;

    const pageNum = Number(page) || 1;
    const sizeNum = Number(size) || 10;
    const skip = (pageNum - 1) * sizeNum;
    const where: any = { user_id: userId };

    if (status !== undefined && status !== null && status !== "") {
      where.order_status = Number(status);
    }

    if (paymentStatus !== undefined && paymentStatus !== null && paymentStatus !== "") {
      where.pay_status = Number(paymentStatus);
    }

    if (keyword) {
      where.order_sn = { contains: String(keyword) } as any;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: sizeNum,
        orderBy: { add_time: "desc" },
      }),
      this.prisma.order.count({ where }),
    ]);

    // 批量查询关联数据（使用原始表名，无 Prisma 关系）
    const orderIds = orders.map((o: any) => o.order_id);
    const userIds = Array.from(new Set(orders.map((o: any) => o.user_id)));
    const shopIds = Array.from(
      new Set(orders.map((o: any) => o.shop_id).filter((id: number) => Number(id) > 0)),
    );

    const [items, users, shops] = await Promise.all([
      orderIds.length
        ? this.prisma.order_item.findMany({ where: { order_id: { in: orderIds } } })
        : Promise.resolve([]),
      userIds.length
        ? this.prisma.user.findMany({
            where: { user_id: { in: userIds as any } },
            select: { user_id: true, username: true, nickname: true, mobile: true },
          })
        : Promise.resolve([]),
      shopIds.length
        ? this.prisma.shop.findMany({
            where: { shop_id: { in: shopIds as any } },
            select: {
              shop_id: true,
              shop_title: true,
              kefu_inlet: true,
              kefu_link: true,
              kefu_phone: true,
              description: true,
              status: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const itemsByOrder: Record<number, any[]> = {};
    for (const it of items as any[]) {
      const oid = it.order_id;
      if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
      itemsByOrder[oid].push(it);
    }

    const userMap = new Map<number, any>();
    for (const u of users as any[]) userMap.set(u.user_id, u);

    const shopMap = new Map<number, any>();
    for (const s of shops as any[]) shopMap.set(s.shop_id, s);

    const records = orders.map((o: any) => this.mapOrderRowToRecord(o, itemsByOrder[o.order_id] || [], userMap, shopMap));

    return {
      records,
      total,
    };
  }

  /**
   * 获取订单详情
   * @param orderId 订单ID
   * @param userId 用户ID
   * @returns 订单详情
   */
  async getOrderDetail(orderId: number, userId?: number) {
    // 使用 snake_case 字段查询，先校验 orderId 合法性，避免 Prisma NaN/undefined 报错
    const oid = Number(orderId);
    if (!Number.isInteger(oid) || oid <= 0) {
      throw new BadRequestException("订单ID无效");
    }
    const where: any = { order_id: oid };
    if (userId) where.user_id = Number(userId);

    const order = await this.prisma.order.findFirst({ where });

    if (!order) {
      throw new NotFoundException("订单不存在");
    }

    // 详情沿用与列表一致的映射
    const [items, user, shop] = await Promise.all([
      this.prisma.order_item.findMany({ where: { order_id: order.order_id } }),
      this.prisma.user.findFirst({
        where: { user_id: order.user_id },
        select: { user_id: true, username: true, nickname: true, mobile: true },
      }),
      order.shop_id > 0
        ? this.prisma.shop.findFirst({
            where: { shop_id: order.shop_id },
            select: {
              shop_id: true,
              shop_title: true,
              kefu_inlet: true,
              kefu_link: true,
              kefu_phone: true,
              description: true,
              status: true,
            },
          })
        : Promise.resolve(null),
    ]);

    const userMap = new Map<number, any>();
    if (user) userMap.set(user.user_id, user);
    const shopMap = new Map<number, any>();
    if (shop) shopMap.set(shop.shop_id, shop);
    return this.mapOrderRowToRecord(order as any, items as any[], userMap, shopMap);
  }

  /**
   * 取消订单
   * @param orderId 订单ID
   * @param userId 用户ID
   * @param reason 取消原因
   * @returns 更新后的订单
   */
  async cancelOrder(orderId: number, userId: number, reason?: string) {
    const order = await this.getOrderDetail(orderId, userId);

    if (order.orderStatus !== 0) {
      // PENDING = 0
      throw new BadRequestException("只有待付款的订单才能取消");
    }

    // 恢复库存
    for (const item of order.orderItems) {
      await this.prisma.product.update({
        where: { productId: item.productId },
        data: {
          productStock: {
            increment: item.quantity,
          },
          clickCount: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 更新订单状态
    return this.prisma.order.update({
      where: { order_id: Number(order.orderId) },
      data: {
        order_status: 2, // CANCELLED = 2
        // cancelReason and cancelTime fields don't exist in schema
      },
    });
  }

  /**
   * 确认收货
   * @param orderId 订单ID
   * @param userId 用户ID
   * @returns 更新后的订单
   */
  async confirmReceive(orderId: number, userId: number) {
    const order = await this.getOrderDetail(orderId, userId);

    if (order.orderStatus !== 1) {
      // SHIPPED = 1
      throw new BadRequestException("只有已发货的订单才能确认收货");
    }

    return this.prisma.order.update({
      where: { order_id: Number(order.orderId) },
      data: {
        order_status: 3, // COMPLETED = 3
        // completeTime field doesn't exist in schema
      },
    });
  }

  /**
   * 删除订单
   * @param orderId 订单ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async deleteOrder(orderId: number, userId: number) {
    const order = await this.getOrderDetail(orderId, userId);

    if (![2, 3].includes(order.orderStatus)) {
      // CANCELLED = 2, COMPLETED = 3
      throw new BadRequestException("只能删除已取消或已完成的订单");
    }

    await this.prisma.order.delete({
      where: { orderId },
    });

    return { message: "订单删除成功" };
  }

  /**
   * 获取订单统计
   * @param userId 用户ID
   * @returns 订单统计
   */
  async getOrderStats(userId: number) {
    const [total, pending, paid, shipped, completed, cancelled] =
      await Promise.all([
        this.prisma.order.count({ where: { user_id: userId } }),
        this.prisma.order.count({
          where: { user_id: userId, order_status: 0 },
        }), // PENDING = 0
        this.prisma.order.count({ where: { user_id: userId, pay_status: 1 } }), // PAID = 1
        this.prisma.order.count({
          where: { user_id: userId, order_status: 1 },
        }), // SHIPPED = 1
        this.prisma.order.count({
          where: { user_id: userId, order_status: 3 },
        }), // COMPLETED = 3
        this.prisma.order.count({
          where: { user_id: userId, order_status: 2 },
        }), // CANCELLED = 2
      ]);

    return {
      total,
      pending,
      paid,
      shipped,
      completed,
      cancelled,
    };
  }

  /**
   * 计算运费
   * @param items 购物车商品
   * @returns 运费
   */
  private calculateShippingFee(items: any[]): number {
    // 简单的运费计算逻辑
    // 实际项目中可能需要更复杂的计算，比如根据地区、重量等
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    // 满99免运费
    if (totalAmount >= 99) {
      return 0;
    }

    return 10; // 默认运费10元
  }

  /**
   * 生成订单号
   * @returns 订单号
   */
  private generateOrderSn(): string {
    const date = new Date();
    const dateStr =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0");
    const timeStr =
      date.getHours().toString().padStart(2, "0") +
      date.getMinutes().toString().padStart(2, "0") +
      date.getSeconds().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

    return `${dateStr}${timeStr}${random}`;
  }

  // ============ helpers ==========
  private mapOrderRowToRecord(o: any, items: any[], userMap: Map<number, any>, shopMap: Map<number, any>) {
    const money = (v: any) => this.formatMoney(v);
    const addTimeText = this.formatUnixToTime(o.add_time);
    const regionIds = this.safeParseArray(o.region_ids);
    const regionNames = this.safeParseArray(o.region_names);
    const addressData = this.safeParseJson(o.address_data);
    const orderExtension = this.safeParseJson(o.order_extension);

    const user = userMap.get(o.user_id);
    const shop = o.shop_id > 0 ? shopMap.get(o.shop_id) : null;

    const userAddress = this.composeUserAddress(regionNames, o.address);
    const shippingTypeId = Number(o.shipping_type_id || 1);
    const shippingTypeName = o.shipping_type_name || "普通快递";

    return {
      orderStatusName: this.getOrderStatusName(o.order_status),
      userAddress,
      shippingStatusName: this.getShippingStatusName(o.shipping_status),
      payStatusName: this.getPayStatusName(o.pay_status),
      orderId: o.order_id,
      orderSn: o.order_sn,
      userId: o.user_id,
      parentOrderId: o.parent_order_id,
      parentOrderSn: o.parent_order_sn,
      orderStatus: o.order_status,
      shippingStatus: o.shipping_status,
      payStatus: o.pay_status,
      addTime: addTimeText,
      consignee: o.consignee,
      address: o.address,
      regionIds,
      regionNames,
      addressData: this.mapAddressData(addressData),
      mobile: o.mobile,
      email: o.email,
      buyerNote: o.buyer_note,
      adminNote: o.admin_note,
      shippingMethod: o.shipping_method,
      logisticsId: o.logistics_id,
      logisticsName: o.logistics_name,
      shippingTypeId,
      shippingTypeName,
      trackingNo: o.tracking_no,
      shippingTime: o.shipping_time ? this.formatUnixToTime(o.shipping_time) : "",
      receivedTime: o.received_time ? this.formatUnixToTime(o.received_time) : "",
      payTypeId: o.pay_type_id,
      payTime: o.pay_time ? this.formatUnixToTime(o.pay_time) : "",
      usePoints: o.use_points,
      isNeedCommisson: o.is_need_commisson ? 1 : 0,
      distributionStatus: o.distribution_status ? 1 : 0,
      referrerUserId: o.referrer_user_id,
      isDel: o.is_del,
      shopId: o.shop_id,
      isStoreSplited: o.is_store_splited,
      commentStatus: o.comment_status,
      totalAmount: money(o.total_amount),
      paidAmount: money(o.paid_amount),
      unpaidAmount: money(o.unpaid_amount),
      unrefundAmount: money(o.unrefund_amount),
      productAmount: money(o.product_amount),
      couponAmount: money(o.coupon_amount),
      pointsAmount: money(o.points_amount),
      discountAmount: money(o.discount_amount),
      balance: money(o.balance),
      onlinePaidAmount: money(o.online_paid_amount),
      offlinePaidAmount: money(o.offline_paid_amount),
      serviceFee: money(o.service_fee),
      shippingFee: money(o.shipping_fee),
      invoiceFee: money(o.invoice_fee),
      orderExtension: this.mapOrderExtension(orderExtension),
      orderSource: o.order_source || "",
      invoiceData: o.invoice_data || "",
      outTradeNo: o.out_trade_no || "",
      isSettlement: o.is_settlement ?? 0,
      isExchangeOrder: o.is_exchange_order ? 1 : 0,
      orderType: o.order_type ?? 1,
      mark: o.mark ?? 0,
      vendorId: o.vendor_id ?? 0,
      availableActions: this.getAvailableActions(o.order_status, o.pay_status, o.shipping_status),
      autoDeliveryDays: null,
      items: items.map((it) => this.mapOrderItem(it)),
      user: user
        ? {
            username: user.username,
            nickname: user.nickname || "",
            userId: user.user_id,
            mobile: user.mobile || "",
          }
        : null,
      shop: shop
        ? {
            statusText: "",
            shopId: shop.shop_id,
            shopTitle: shop.shop_title || "",
            kefuInlet: this.safeParseArray(shop.kefu_inlet),
            kefuLink: shop.kefu_link || "",
            kefuPhone: shop.kefu_phone || "",
            description: shop.description || "",
          }
        : null,
      payLog: null,
    };
  }

  private mapOrderItem(it: any) {
    const money = (v: any) => this.formatMoney(v);
    const skuData = this.safeParseArray(it.sku_data);
    const skuValue = Array.isArray(skuData)
      ? skuData.map((p: any) => `${p.name}:${p.value}`).join("|")
      : it.sku_data || null;
    return {
      itemId: it.item_id,
      orderId: it.order_id,
      orderSn: it.order_sn,
      userId: it.user_id,
      price: money(it.price),
      quantity: it.quantity,
      productId: it.product_id,
      productName: it.product_name,
      productSn: it.product_sn,
      picThumb: it.pic_thumb,
      skuId: it.sku_id,
      skuData: Array.isArray(skuData) ? skuData : [],
      deliveryQuantity: it.delivery_quantity,
      productType: it.product_type,
      isGift: it.is_gift,
      shopId: it.shop_id,
      isPin: it.is_pin,
      prepayPrice: money(it.prepay_price),
      commission: it.commission || "",
      originPrice: money(it.origin_price),
      isSeckill: it.is_seckill || 0,
      extraSkuData: this.safeParseArray(it.extra_sku_data) || [],
      suppliersId: it.suppliers_id || 0,
      cardGroupName: it.card_group_name || "",
      vendorProductId: it.vendor_product_id || 0,
      vendorProductSkuId: it.vendor_product_sku_id || 0,
      vendorId: it.vendor_id || 0,
      vendorProductSupplyPrice: null,
      productPicThumb: it.pic_thumb,
      productStock: null as any, // 未在订单项中存储，前端示例可置空或另查
      productWeight: "0.000",
      virtualSample: "",
      paidContent: "",
      cardGroupId: 0,
      skuStock: null,
      skuSn: "",
      skuValue,
      aftersalesItem: null,
      eCard: [],
    };
  }

  private mapAddressData(addr: any) {
    if (!addr || typeof addr !== "object") return null;
    return {
      addressId: addr.address_id ?? addr.addressId ?? 0,
      addressTag: addr.address_tag ?? addr.addressTag ?? "",
      userId: addr.user_id ?? addr.userId ?? 0,
      consignee: addr.consignee ?? "",
      email: addr.email ?? "",
      regionIds: addr.region_ids ?? addr.regionIds ?? [],
      regionNames: addr.region_names ?? addr.regionNames ?? [],
      address: addr.address ?? "",
      postcode: addr.postcode ?? "",
      telephone: addr.telephone ?? "",
      mobile: addr.mobile ?? "",
      mobileAreaCode: addr.mobile_area_code ?? addr.mobileAreaCode ?? null,
      isDefault: addr.is_default ?? addr.isDefault ?? 0,
      isSelected: addr.is_selected ?? addr.isSelected ?? 0,
    };
  }

  private mapOrderExtension(ext: any) {
    if (!ext) return { couponAmount: [], discountAmount: [], shippingFee: [], shippingType: [] };
    // 直接返回解析结果，尽量与示例结构保持一致（数组或按 shopId 的对象）
    return ext;
  }

  private getOrderStatusName(status: number) {
    switch (Number(status)) {
      case 0:
        return "待支付";
      case 1:
        return "已发货";
      case 2:
        return "已取消";
      case 3:
        return "已完成";
      default:
        return "";
    }
  }

  private getShippingStatusName(status: number) {
    switch (Number(status)) {
      case 0:
        return "待发货";
      case 1:
        return "已发货";
      case 2:
        return "部分发货";
      default:
        return "";
    }
  }

  private getPayStatusName(status: number) {
    switch (Number(status)) {
      case 0:
        return "待支付";
      case 1:
        return "已支付";
      case 2:
        return "部分支付";
      default:
        return "";
    }
  }

  private getAvailableActions(orderStatus: number, payStatus: number, shippingStatus: number) {
    const isPendingPay = Number(orderStatus) === 0 && Number(payStatus) === 0;
    const isPaid = Number(payStatus) === 1;
    const isShipped = Number(shippingStatus) === 1;
    const isCompleted = Number(orderStatus) === 3;
    const isCancelled = Number(orderStatus) === 2;
    return {
      setConfirm: isPendingPay || isPaid,
      toPay: isPendingPay,
      setPaid: isPendingPay,
      setUnpaid: false,
      cancelOrder: isPendingPay,
      delOrder: isCancelled,
      deliver: isPaid && !isShipped,
      confirmReceipt: isShipped,
      splitOrder: false,
      modifyOrder: !isCompleted && !isCancelled,
      rebuy: false,
      modifyOrderMoney: isPendingPay,
      modifyOrderConsignee: !isCompleted && !isCancelled,
      modifyOrderProduct: false,
      modifyShippingInfo: !isCompleted && !isCancelled,
      toAftersales: false,
      toComment: false,
    };
  }

  private formatMoney(v: any): string {
    const n = Number(v ?? 0);
    return n.toFixed(2);
    }

  private formatUnixToTime(v: any): string {
    const ts = Number(v || 0);
    if (!ts) return "";
    const d = new Date(ts * 1000);
    const pad = (x: number) => String(x).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  }

  private safeParseJson(s: any) {
    if (!s) return null;
    if (typeof s === "object") return s;
    try {
      return JSON.parse(String(s));
    } catch (e) {
      return null;
    }
  }

  private safeParseArray(s: any) {
    if (!s) return [];
    if (Array.isArray(s)) return s;
    if (typeof s === "object") return s as any[];
    try {
      const parsed = JSON.parse(String(s));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // 兼容以逗号分隔的字符串
      const str = String(s);
      if (str.includes(",")) return str.split(",").map((x) => (isNaN(Number(x)) ? x : Number(x)));
      return [];
    }
  }

  private composeUserAddress(regionNames: any[], address: string) {
    const names = Array.isArray(regionNames) ? regionNames.filter(Boolean) : [];
    // 直辖市省市同名时去重
    const uniq: string[] = [];
    for (const n of names) if (!uniq.includes(n)) uniq.push(n);
    const prefix = uniq.slice(0, 2).join(" ");
    return prefix ? `${prefix} ${address || ""}`.trim() : address || "";
  }
}
