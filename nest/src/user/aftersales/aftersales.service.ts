// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AftersalesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取可售后订单列表
   */
  async getAfterSalesOrderList(userId: number, query: any) {
    const page = query.page || 1;
    const size = query.size || 15;
    const skip = (page - 1) * size;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          user_id: userId,
          order_status: { not: 4 }, // 未取消的订单
          pay_status: 1, // 已支付
        },
        orderBy: { order_id: "desc" },
        skip,
        take: size,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.order.count({
        where: {
          user_id: userId,
          order_status: { not: 4 },
          pay_status: 1,
        },
      }),
    ]);

    // 过滤出可售后的订单项
    const aftersalesOrders = orders
      .map((order) => ({
        ...order,
        orderItems: order.orderItems.filter(
          (item) => item.aftersales_status === 0, // 未申请售后的商品
        ),
      }))
      .filter((order) => order.orderItems.length > 0);

    return {
      records: aftersalesOrders,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取售后配置
   */
  async getAftersalesConfig() {
    // 兼容旧 PHP 返回结构
    return {
      aftersaleType: {
        2: "仅退款",
        1: "退货/退款",
      },
      aftersaleReason: [
        "多拍/拍错/不喜欢",
        "未按约定时间发货",
        "协商一致退款",
        "地址/电话填错了",
        "其他",
      ],
    };
  }

  /**
   * 获取售后申请详情
   */
  async getApplyData(query: { item_id?: number; order_id?: number }) {
    const { item_id, order_id } = query;

    if (!order_id) {
      throw new HttpException("订单ID不能为空", HttpStatus.BAD_REQUEST);
    }

    const order = await this.prisma.order.findUnique({
      where: { order_id },
      include: {
        orderItems: {
          where: item_id ? { order_item_id: item_id } : {},
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new HttpException("订单不存在", HttpStatus.NOT_FOUND);
    }

    // list: 仅返回可申请售后的商品（排除赠品 is_gift=1、已申请售后 aftersales_status!=0）
    const list = order.orderItems
      .filter((item) => item.aftersales_status === 0 && item.is_gift === 0)
      .map((it) => {
        const price = Number(it.price || it.product_price || 0);
        const quantity = Number(it.quantity || it.number || 0);
        return {
          itemId: it.order_item_id,
            picThumb: it.pic_thumb || it.product?.pic_thumb || it.product?.picThumb || "",
          isGift: it.is_gift || 0,
          productSn: it.product_sn || it.product?.product_sn || "",
          productName: it.product_name || it.product?.product_name || it.product?.productName || "",
          price: price.toFixed(2),
          quantity,
          subtotal: (price * quantity).toFixed(2),
          skuData: (() => {
            try {
              if (it.sku_data) {
                const parsed = JSON.parse(it.sku_data);
                if (Array.isArray(parsed)) return parsed;
              }
            } catch {}
            return [];
          })(),
          canApplyQuantity: quantity, // 暂无部分售后占用数量逻辑
        };
      });

    // 订单结构：复用现有字段命名（PHP 示例），这里保持简单
    const orderStruct = {
      orderStatusName: this.getOrderStatusName(order),
      userAddress: "", // 可按需拼接省市区，这里暂留空（或查询 region 表）
      shippingStatusName: Number(order.shipping_status) > 0 ? "已发货" : "待发货",
      payStatusName: Number(order.pay_status) > 0 ? "已支付" : "待支付",
      totalProductWeight: 0,
      orderId: order.order_id,
      orderSn: order.order_sn,
      userId: order.user_id,
      parentOrderId: order.parent_order_id || 0,
      parentOrderSn: String(order.parent_order_sn || 0),
      orderStatus: order.order_status,
      shippingStatus: order.shipping_status,
      payStatus: order.pay_status,
      addTime: this.formatTime(order.add_time),
      consignee: order.consignee || "",
      address: order.address || "",
      regionIds: [],
      regionNames: [],
      addressData: null,
      mobile: order.mobile || "",
      email: order.email || "",
      buyerNote: order.buyer_note || "",
      adminNote: order.admin_note || "",
      shippingMethod: order.shipping_method || 0,
      logisticsId: order.logistics_id || 0,
      logisticsName: order.logistics_name || "",
      shippingTypeId: order.shipping_type_id || 0,
      shippingTypeName: order.shipping_type_name || "",
      trackingNo: order.tracking_no || "",
      shippingTime: this.formatTime(order.shipping_time),
      receivedTime: this.formatTime(order.received_time),
      payTypeId: order.pay_type_id || 0,
      payTime: this.formatTime(order.pay_time),
      usePoints: order.use_points || 0,
      isNeedCommisson: order.is_need_commisson || 0,
      distributionStatus: order.distribution_status || 0,
      referrerUserId: order.referrer_user_id || 0,
      isDel: order.is_del || 0,
      shopId: order.shop_id || 0,
      isStoreSplited: order.is_store_splited || 0,
      commentStatus: order.comment_status || 0,
      totalAmount: this.toMoney(order.order_amount),
      paidAmount: this.toMoney(order.paid_amount),
      unpaidAmount: this.toMoney(order.unpaid_amount),
      unrefundAmount: this.toMoney(order.unrefund_amount),
      productAmount: this.toMoney(order.product_amount),
      couponAmount: this.toMoney(order.coupon_amount),
      pointsAmount: this.toMoney(order.points_amount),
      discountAmount: this.toMoney(order.discount_amount),
      balance: this.toMoney(order.balance),
      onlinePaidAmount: this.toMoney(order.online_paid_amount),
      offlinePaidAmount: this.toMoney(order.offline_paid_amount),
      serviceFee: this.toMoney(order.service_fee),
      shippingFee: this.toMoney(order.shipping_fee),
      invoiceFee: this.toMoney(order.invoice_fee),
      orderExtension: [],
      orderSource: order.order_source || "",
      invoiceData: order.invoice_data || "",
      outTradeNo: order.out_trade_no || "",
      isSettlement: order.is_settlement || 0,
      isExchangeOrder: order.is_exchange_order || 0,
      orderType: order.order_type || 0,
      mark: order.mark || 0,
      vendorId: order.vendor_id || null,
      items: list.map((l) => ({
        itemId: l.itemId,
        orderId: order.order_id,
        orderSn: order.order_sn,
        userId: order.user_id,
        price: l.price,
        quantity: l.quantity,
        productId: 0, // 未在简化查询中取 product_id，可后续补上
        productName: l.productName,
        productSn: l.productSn,
        picThumb: l.picThumb,
        skuId: 0,
        skuData: l.skuData,
        deliveryQuantity: 0,
        productType: 1,
        isGift: l.isGift,
        shopId: order.shop_id || 0,
        subtotal: l.subtotal,
        aftersalesItem: null,
        eCard: [],
      })),
      availableActions: {
        setConfirm: false,
        toPay: false,
        setPaid: false,
        setUnpaid: false,
        cancelOrder: false,
        delOrder: false,
        deliver: false,
        confirmReceipt: Number(order.shipping_status) > 0 && Number(order.order_status) !== 5 && Number(order.order_status) !== 3,
        splitOrder: false,
        modifyOrder: false,
        rebuy: false,
        modifyOrderMoney: false,
        modifyOrderConsignee: false,
        modifyOrderProduct: false,
        modifyShippingInfo: true,
        toAftersales: Number(order.pay_status) > 0 && Number(order.order_status) !== 3,
        toComment: false,
      },
      stepStatus: { current: 0, status: "process", steps: [] },
      autoDeliveryDays: null,
      user: null,
      shop: null,
    };

    return { list, order: orderStruct };
  }

  private toMoney(v: any) { return Number(v || 0).toFixed(2); }
  private formatTime(v: any) { const ts = Number(v || 0); if (!ts) return ""; const d = new Date(ts * 1000); const p=(n:number)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }
  private getOrderStatusName(order: any) {
    const s = Number(order.order_status);
    const ship = Number(order.shipping_status);
    const pay = Number(order.pay_status);
    if (s === 0) return pay === 0 ? "待支付" : "待发货";
    if (s === 1) return ship > 0 ? "待收货" : "待发货";
    if (s === 2) return ship > 0 ? "待收货" : "待发货";
    if (s === 3) return "已取消";
    if (s === 5) return "已完成";
    return "";
  }

  /**
   * 创建售后申请
   */
  async createAfterSales(userId: number, data: any) {
    // 验证订单
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: data.order_id,
        user_id: userId,
      },
    });

    if (!order) {
      throw new HttpException("订单不存在", HttpStatus.NOT_FOUND);
    }

    // 验证订单项
    for (const item of data.items) {
      const orderItem = await this.prisma.orderItem.findFirst({
        where: {
          order_item_id: item.order_item_id,
          order_id: data.order_id,
          aftersales_status: 0, // 未申请售后
        },
      });

      if (!orderItem) {
        throw new HttpException(
          "订单项不存在或已申请售后",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 创建售后申请
    const aftersales = await this.prisma.aftersales.create({
      data: {
        user_id: userId,
        order_id: data.order_id,
        aftersale_type: data.aftersale_type,
        aftersale_reason: data.aftersale_reason,
        description: data.description,
        refund_amount: data.refund_amount,
        pics: data.pics || [],
        status: 1, // 待处理
        add_time: new Date(),
      },
    });

    // 创建售后商品项
    for (const item of data.items) {
      await this.prisma.aftersalesItem.create({
        data: {
          aftersale_id: aftersales.aftersale_id,
          order_item_id: item.order_item_id,
          number: item.number,
        },
      });

      // 更新订单项的售后状态
      await this.prisma.orderItem.update({
        where: { order_item_id: item.order_item_id },
        data: { aftersales_status: 1 }, // 售后中
      });
    }

    return { success: true };
  }

  /**
   * 更新售后申请
   */
  async updateAfterSales(userId: number, data: any) {
    const aftersales = await this.prisma.aftersales.findFirst({
      where: {
        aftersale_id: data.aftersale_id,
        user_id: userId,
        status: 1, // 只有待处理状态可以修改
      },
    });

    if (!aftersales) {
      throw new HttpException(
        "售后申请不存在或状态不允许修改",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 更新售后申请
    await this.prisma.aftersales.update({
      where: { aftersale_id: data.aftersale_id },
      data: {
        aftersale_type: data.aftersale_type,
        aftersale_reason: data.aftersale_reason,
        description: data.description,
        refund_amount: data.refund_amount,
        pics: data.pics || [],
      },
    });

    // 删除原有的售后商品项
    await this.prisma.aftersalesItem.deleteMany({
      where: { aftersale_id: data.aftersale_id },
    });

    // 创建新的售后商品项
    for (const item of data.items) {
      await this.prisma.aftersalesItem.create({
        data: {
          aftersale_id: data.aftersale_id,
          order_item_id: item.order_item_id,
          number: item.number,
        },
      });
    }

    return { success: true };
  }

  /**
   * 获取售后申请记录
   */
  async getAfterSalesRecord(userId: number, query: any) {
    const page = query.page || 1;
    const size = query.size || 15;
    const skip = (page - 1) * size;

    const [aftersales, total] = await Promise.all([
      this.prisma.aftersales.findMany({
        where: { user_id: userId },
        orderBy: { aftersale_id: "desc" },
        skip,
        take: size,
        include: {
          order: {
            select: {
              order_sn: true,
              order_amount: true,
            },
          },
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.aftersales.count({
        where: { user_id: userId },
      }),
    ]);

    return {
      records: aftersales,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取售后详情
   */
  async getAfterSalesDetail(id: number) {
    const aftersales = await this.prisma.aftersales.findUnique({
      where: { aftersale_id: id },
      include: {
        order: {
          select: {
            order_sn: true,
            order_amount: true,
            shipping_fee: true,
            pay_time: true,
          },
        },
        items: {
          include: {
            orderItem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!aftersales) {
      throw new HttpException("售后申请不存在", HttpStatus.NOT_FOUND);
    }

    return aftersales;
  }

  /**
   * 获取售后日志记录
   */
  async getAfterSalesDetailLog(id: number) {
    const logs = await this.prisma.aftersalesLog.findMany({
      where: { aftersale_id: id },
      orderBy: { log_id: "desc" },
    });

    return logs;
  }

  /**
   * 提交售后反馈
   */
  async submitFeedback(userId: number, data: any) {
    const aftersales = await this.prisma.aftersales.findFirst({
      where: {
        aftersale_id: data.id,
        user_id: userId,
      },
    });

    if (!aftersales) {
      throw new HttpException("售后申请不存在", HttpStatus.NOT_FOUND);
    }

    // 创建售后日志
    await this.prisma.aftersalesLog.create({
      data: {
        aftersale_id: data.id,
        user_id: userId,
        log_info: data.log_info,
        return_pic: data.return_pic || [],
        logistics_name: data.logistics_name,
        tracking_no: data.tracking_no,
        add_time: new Date(),
      },
    });

    // 更新售后状态
    await this.prisma.aftersales.update({
      where: { aftersale_id: data.id },
      data: {
        status: 3, // 已寄回
        return_time: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * 撤销售后申请
   */
  async cancelAfterSales(userId: number, aftersaleId: number) {
    const aftersales = await this.prisma.aftersales.findFirst({
      where: {
        aftersale_id: aftersaleId,
        user_id: userId,
        status: 1, // 只有待处理状态可以撤销
      },
    });

    if (!aftersales) {
      throw new HttpException(
        "售后申请不存在或状态不允许撤销",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 更新售后状态
    await this.prisma.aftersales.update({
      where: { aftersale_id: aftersaleId },
      data: {
        status: 5, // 已撤销
        cancel_time: new Date(),
      },
    });

    // 恢复订单项的售后状态
    const items = await this.prisma.aftersalesItem.findMany({
      where: { aftersale_id: aftersaleId },
    });

    for (const item of items) {
      await this.prisma.orderItem.update({
        where: { order_item_id: item.order_item_id },
        data: { aftersales_status: 0 }, // 恢复为未申请售后
      });
    }

    return { success: true };
  }
}
