// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
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
      const product = await this.prisma.product.findFirst({
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
          await tx.product.updateMany({
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
    const { page = 1, size = 10 } = query;
    // 兼容多种查询参数命名（与 PHP 对齐），-1 表示不过滤
    const keyword = query.keyword ?? query.orderSn ?? query.order_sn ?? "";
    const orderStatusRaw = query.orderStatus ?? query.status;
    const payStatusRaw = query.payStatus ?? query.paymentStatus;
    const shippingStatusRaw = query.shippingStatus;
    const commentStatusRaw = query.commentStatus;

    const pageNum = Number(page) || 1;
    const sizeNum = Number(size) || 10;
    const skip = (pageNum - 1) * sizeNum;
    const where: any = { user_id: userId };

    const toNum = (v: any) => (v === undefined || v === null || v === "" ? undefined : Number(v));
    const orderStatus = toNum(orderStatusRaw);
    if (orderStatus !== undefined && orderStatus !== -1) where.order_status = orderStatus;
    const payStatus = toNum(payStatusRaw);
    if (payStatus !== undefined && payStatus !== -1) where.pay_status = payStatus;
    const shippingStatus = toNum(shippingStatusRaw);
    if (shippingStatus !== undefined && shippingStatus !== -1) where.shipping_status = shippingStatus;
    const commentStatus = toNum(commentStatusRaw);
    if (commentStatus !== undefined && commentStatus !== -1) where.comment_status = commentStatus;

    // PHP 行为补充：当仅筛选“待评价”(commentStatus=0) 且未显式限定订单状态时，
    // 需排除待支付/已取消，保留已确认和已完成，且必须已支付。
    const hasExplicitOrderStatus = orderStatus !== undefined && orderStatus !== -1;
    if (!hasExplicitOrderStatus && commentStatus === 0) {
      // 若调用方未指定 pay_status，则限定为已支付集合 [1,2]
      if (where.pay_status === undefined) {
        (where as any).pay_status = { in: [1, 2] } as any;
      }
      // 限定订单状态为已确认(1) 或 已完成(3)
      (where as any).order_status = { in: [1, 3] } as any;
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

    const [items, users, shops, paylogs] = await Promise.all([
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
      orderIds.length
        ? this.prisma.paylog.findMany({
            where: { order_id: { in: orderIds } },
            select: { order_id: true, pay_sn: true, pay_code: true, transaction_id: true, add_time: true },
            orderBy: { add_time: "desc" },
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

    // 聚合每个订单的最新 paylog
    const paylogByOrder = new Map<number, { paySn: string; payCode: string; transactionId: string; orderId: number; add_time: number }>();
    for (const p of paylogs as any[]) {
      const oid = Number(p.order_id);
      if (!paylogByOrder.has(oid)) {
        paylogByOrder.set(oid, {
          paySn: p.pay_sn || "",
          payCode: p.pay_code || "",
          transactionId: p.transaction_id || "",
          orderId: oid,
          add_time: Number(p.add_time || 0),
        });
      }
    }

    let records = orders.map((o: any) => this.mapOrderRowToRecord(o, itemsByOrder[o.order_id] || [], userMap, shopMap));
    records = records.map((r: any) => ({
      ...r,
      payLog: paylogByOrder.get(Number(r.orderId))
        ? {
            paySn: paylogByOrder.get(Number(r.orderId))!.paySn,
            payCode: paylogByOrder.get(Number(r.orderId))!.payCode,
            transactionId: paylogByOrder.get(Number(r.orderId))!.transactionId,
            orderId: Number(r.orderId),
          }
        : null,
    }));

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
    const base = this.mapOrderRowToRecord(order as any, items as any[], userMap, shopMap);
    // 附加最近一条 paylog
    const lastPaylog = await this.prisma.paylog.findFirst({
      where: { order_id: order.order_id },
      select: { pay_sn: true, pay_code: true, transaction_id: true },
      orderBy: { add_time: "desc" },
    });
    // 计算总商品重量（按商品重量*数量）
    let totalProductWeight = 0;
    const pids = Array.from(new Set((items as any[]).map((x) => Number(x.product_id)).filter((n) => Number.isFinite(n) && n > 0)));
    if (pids.length) {
      const products = await this.prisma.product.findMany({ where: { product_id: { in: pids as any } }, select: { product_id: true, product_weight: true } });
      const wmap = new Map<number, number>();
      for (const p of products as any[]) wmap.set(Number(p.product_id), Number(p.product_weight || 0));
      for (const it of items as any[]) {
        const w = wmap.get(Number(it.product_id)) || 0;
        totalProductWeight += w * Number(it.quantity || 0);
      }
    }
    return {
      ...base,
      payLog: lastPaylog
        ? {
            paySn: lastPaylog.pay_sn || "",
            payCode: lastPaylog.pay_code || "",
            transactionId: lastPaylog.transaction_id || "",
            orderId: Number(order.order_id),
          }
        : null,
      stepStatus: this.buildStepStatus(order as any),
      totalProductWeight: Number(totalProductWeight || 0),
    };
  }

  /**
   * 取消订单
   * @param orderId 订单ID
   * @param userId 用户ID
   * @param reason 取消原因
   * @returns 更新后的订单
   */
  async cancelOrder(orderId: number, userId: number, reason?: string) {
    // 使用原表字段校验，避免 detail 映射差异
    const rawOrder = await this.prisma.order.findFirst({
      where: { order_id: Number(orderId), user_id: Number(userId) },
    });
    if (!rawOrder) throw new NotFoundException("订单不存在");

    // 仅允许待付款状态（order_status=0 且 pay_status=0）的订单取消
    if (Number(rawOrder.order_status) !== 0 || Number(rawOrder.pay_status) !== 0) {
      throw new BadRequestException("只有待付款的订单才能取消");
    }

    const items = await this.prisma.order_item.findMany({ where: { order_id: Number(orderId) } });
    const now = Math.floor(Date.now() / 1000);

    await this.prisma.$transaction(async (tx) => {
      // 恢复库存 + 写入库存变更日志
      for (const it of items as any[]) {
        const quantity = Number(it.quantity || 0);
        if (quantity <= 0) continue;
        const productId = Number(it.product_id || 0);
        const skuId = Number(it.sku_id || 0);
        const shopId = Number(it.shop_id || 0);
        const isGift = Number(it.is_gift || 0) === 1;

        if (isGift) {
          // 赠品按商品维度恢复
          if (productId > 0) {
            // product 表使用复合主键，不能仅用 product_id 调用 findUnique，这里改为 findFirst
            const prod = await tx.product.findFirst({ where: { product_id: productId }, select: { product_stock: true } });
            if (prod) {
              const oldNum = Number(prod.product_stock || 0);
              const newNum = oldNum + quantity;
              await tx.product.updateMany({ where: { product_id: productId }, data: { product_stock: newNum } });
              await tx.product_inventory_log.create({
                data: {
                  product_id: productId,
                  spec_id: 0,
                  number: quantity,
                  add_time: now,
                  old_number: oldNum,
                  // type: true 表示入库/增加
                  type: true as any,
                  change_number: quantity,
                  desc: "取消订单恢复库存",
                  shop_id: shopId,
                },
              });
            }
          }
          continue;
        }

        if (skuId > 0) {
          // 恢复 SKU 库存，同时恢复商品总库存
          const sku = await tx.product_sku.findUnique({ where: { sku_id: skuId }, select: { sku_stock: true, product_id: true } });
          if (sku) {
            const oldSku = Number(sku.sku_stock || 0);
            const newSku = oldSku + quantity;
            await tx.product_sku.update({ where: { sku_id: skuId }, data: { sku_stock: newSku } });

            const pId = Number(sku.product_id || productId || 0);
            if (pId > 0) {
              // 复合主键限制：使用 findFirst 而不是 findUnique
              const prod = await tx.product.findFirst({ where: { product_id: pId }, select: { product_stock: true } });
              if (prod) {
                const oldProd = Number(prod.product_stock || 0);
                const newProd = oldProd + quantity;
                await tx.product.updateMany({ where: { product_id: pId }, data: { product_stock: newProd } });
                await tx.product_inventory_log.create({
                  data: {
                    product_id: pId,
                    spec_id: skuId,
                    number: quantity,
                    add_time: now,
                    old_number: oldSku,
                    type: true as any,
                    change_number: quantity,
                    desc: "取消订单恢复库存",
                    shop_id: shopId,
                  },
                });
              }
            }
          }
        } else if (productId > 0) {
          // 无规格商品直接恢复商品总库存
          // 复合主键限制：使用 findFirst 而不是 findUnique
          const prod = await tx.product.findFirst({ where: { product_id: productId }, select: { product_stock: true } });
          if (prod) {
            const oldNum = Number(prod.product_stock || 0);
            const newNum = oldNum + quantity;
            await tx.product.updateMany({ where: { product_id: productId }, data: { product_stock: newNum } });
            await tx.product_inventory_log.create({
              data: {
                product_id: productId,
                spec_id: 0,
                number: quantity,
                add_time: now,
                old_number: oldNum,
                type: true as any,
                change_number: quantity,
                desc: "取消订单恢复库存",
                shop_id: shopId,
              },
            });
          }
        }
      }

      // 更新订单状态为已取消
      await tx.order.update({
        where: { order_id: Number(orderId) },
        data: { order_status: 2 }, // CANCELLED = 2
      });
    });

    // 返回最新详情
    return this.getOrderDetail(orderId, userId);
  }

  /**
   * 确认收货
   * @param orderId 订单ID
   * @param userId 用户ID
   * @returns 更新后的订单
   */
  async confirmReceive(orderId: number, userId: number) {
    const order = await this.getOrderDetail(orderId, userId);

    // 前端 user 详情里 orderStatus=1 表示待发货，而是否已发货应参考 shipping_status
    // 重新从 DB 拿原始记录避免映射后的语义偏差
    const raw = await this.prisma.order.findUnique({ where: { order_id: Number(orderId) } });
    if (!raw) throw new NotFoundException("订单不存在");
    if (Number(raw.order_status) === 2) throw new BadRequestException("已取消订单无法确认收货");
    if (Number(raw.order_status) === 3) return raw; // 幂等
    if (Number(raw.shipping_status) === 0) throw new BadRequestException("未发货订单不能确认收货");

    const now = Math.floor(Date.now() / 1000);
    return this.prisma.order.update({
      where: { order_id: Number(orderId) },
      data: {
        order_status: 3, // 已完成
        shipping_status: Number(raw.shipping_status) === 0 ? 1 : raw.shipping_status,
        received_time: now,
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
    // awaitPay: 待付款 -> pay_status = 0 且 order_status = 0 (未取消)
    // awaitShipping: 待发货 -> 已付款 (pay_status = 1) 且 shipping_status = 0 且 order_status = 0/1 (未取消未完成)
    // awaitReceived: 待收货 -> 已发货 (shipping_status = 1) 且 未完成 (order_status != 3)
    // awaitComment: 待评价 -> 已完成 (order_status = 3) 且 comment_status = 0
    // orderCompleted: 已完成 -> order_status = 3
    // productCollect: collect_product.count
    // shopCollect: collect_shop.count
    // awaitAftersalesCollect: 用户发起的售后单（仅统计进行中） -> aftersales.status IN (0,1,2?) 暂假设 status != 3 代表进行中

    const [
      awaitPay,
      awaitShipping,
      awaitReceived,
      awaitComment,
      orderCompleted,
      productCollect,
      shopCollect,
      awaitAftersalesCollect,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { user_id: userId, pay_status: 0, order_status: { in: [0, 1] } },
      }),
      this.prisma.order.count({
        where: {
          user_id: userId,
          pay_status: 1,
          shipping_status: 0,
          order_status: { in: [0, 1] },
        },
      }),
      this.prisma.order.count({
        where: {
          user_id: userId,
          shipping_status: 1,
          order_status: { not: 3 },
        },
      }),
      this.prisma.order.count({
        where: { user_id: userId, order_status: 3, comment_status: 0 },
      }),
      this.prisma.order.count({ where: { user_id: userId, order_status: 3 } }),
      this.prisma.collect_product.count({ where: { user_id: userId } }),
      this.prisma.collect_shop.count({ where: { user_id: userId } }),
      this.prisma.aftersales.count({
        where: { user_id: userId, status: { not: 3 } }, // 假设 status=3 为已完结
      }),
    ]);

    return {
      awaitPay,
      awaitShipping,
      awaitReceived,
      awaitComment,
      orderCompleted,
      productCollect,
      shopCollect,
      awaitAftersalesCollect,
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
      // 额外补齐以匹配 PHP 返回
      stock: (it as any).sku_stock ?? null,
      subtotal: money((Number(it.price || 0) || 0) * (Number(it.quantity || 0) || 0)),
      allowDeliverNum: Math.max(0, Number(it.quantity || 0) - Number(it.delivery_quantity || 0)),
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
        // PHP 语义：1 表示已确认，未发货阶段展示“待发货”
        return "待发货";
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
        // 与 PHP 返回对齐：2 也显示为“已支付”
        return "已支付";
      default:
        return "";
    }
  }

  private buildStepStatus(order: any) {
    const addDesc = this.formatUnixToTime(order.add_time);
    const paid = Number(order.pay_status) > 0;
    const shipped = Number(order.shipping_status) > 0;
    const steps = [
      { title: "提交订单", description: addDesc },
      { title: paid ? "已支付" : "待支付", description: paid ? this.formatUnixToTime(order.pay_time) : "" },
      { title: shipped ? "已发货" : "待发货", description: shipped ? this.formatUnixToTime(order.shipping_time) : "" },
    ];
    let current = 1;
    if (shipped) current = 3; else if (paid) current = 2; else current = 1;
    return { current, status: "process", steps };
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
