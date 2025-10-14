// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceState, AllowedTransitions, ServiceStateToOrderStatus, LogEvent, extractServiceState } from './dine-order.constants';
import { PrismaService } from '../prisma/prisma.service';
import { PickupNoService } from './pickup-no.service';
import { DineOrderEventsService } from './dine-order-events.service';
import { RedisService } from '../redis/redis.service';
import { CreateDineOrderDto } from './dto/create-dine-order.dto';

@Injectable()
export class DineOrderService {
  constructor(private readonly prisma: PrismaService, private readonly pickup: PickupNoService, private readonly redis: RedisService, private readonly events: DineOrderEventsService) {}
  private buildIdemKey(kind: string, userId: number, shopId: number, token?: string) {
    if (!token) return null;
    return `dine_idem:${kind}:${shopId}:${userId}:${token}`;
  }
  
  private async enterIdempotency(key: string) {
    // 设置占位符 (PENDING)；若已存在则返回 false
    const ok = await this.redis['redis'].set(key, 'PENDING', 'EX', 300, 'NX');
    return ok === 'OK';
  }
  private async getIdemResult(key: string) {
    try { return await this.redis['redis'].get(key); } catch { return null; }
  }
  async create(userId: number, shopId: number, dto: CreateDineOrderDto, idemToken?: string) {
    if (![2,3].includes(dto.orderType)) throw new BadRequestException('orderType must be 2(dine) or 3(takeout)');
    if (dto.orderType === 2 && !dto.tableNo) throw new BadRequestException('堂食需要提供桌号');
    if (dto.orderType === 3 && dto.tableNo) throw new BadRequestException('外带不应提供桌号');
    if (!shopId) throw new BadRequestException('缺少 shopId');

    const idemKey = this.buildIdemKey('create', userId, shopId, idemToken);
    if (idemKey) {
      const first = await this.enterIdempotency(idemKey);
      if (!first) {
        const val = await this.getIdemResult(idemKey);
        if (val && /^\d+$/.test(val)) {
          const existed = await this.prisma.order.findUnique({ where: { order_id: Number(val) } });
          if (existed) return existed;
        }
        // fallback (可能仍在创建中)
        const recent = await this.prisma.order.findFirst({ where: { user_id: userId, shop_id: shopId }, orderBy: { order_id: 'desc' } });
        if (recent) return recent;
      }
    }

    const { day, no } = await this.pickup.next(shopId);
    const now = Math.floor(Date.now()/1000);
    const orderSn = this.genSn();
    const extension = {
      dineScene: dto.orderType === 2 ? 'DINE_IN' : 'TAKEOUT',
      peopleCount: dto.peopleCount || null,
      serviceState: 'CREATED',
      isAppend: false,
      remark: dto.remark || '',
    };

    // 计算商品金额（简单版：取 product.product_price）
    let productAmount = 0;
    const itemsInput = dto.items || [];
    const productIds = itemsInput.map(i => i.productId);
    const products = productIds.length ? await this.prisma.product.findMany({ where: { product_id: { in: productIds as any } } }) : [];
    const prodMap = new Map<number, any>();
    for (const p of products as any[]) prodMap.set(p.product_id, p);
    for (const item of itemsInput) {
      const prod = prodMap.get(item.productId);
      if (!prod) throw new BadRequestException(`商品不存在: ${item.productId}`);
      if (Number(prod.is_delete) === 1) throw new BadRequestException(`商品已下架: ${item.productId}`);
      const qty = Number(item.quantity || 0);
      if (qty <= 0) throw new BadRequestException('商品数量必须大于0');
      productAmount += Number(prod.product_price) * qty;
    }
    const totalAmount = productAmount; // 暂无服务费/打包费
    const unpaidAmount = totalAmount;

    const created = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
        order_sn: orderSn,
        user_id: userId,
        shop_id: shopId,
        order_type: dto.orderType,
        add_time: now,
        order_extension: JSON.stringify(extension),
        order_source: 'QR',
        table_no: dto.tableNo || null,
        pickup_day: day,
        pickup_no: no,
        total_amount: totalAmount,
        product_amount: productAmount,
        unpaid_amount: unpaidAmount,
        paid_amount: 0,
        unrefund_amount: 0,
        coupon_amount: 0,
        points_amount: 0,
        discount_amount: 0,
        balance: 0,
        online_paid_amount: 0,
        offline_paid_amount: 0,
        service_fee: 0,
        shipping_fee: 0,
        invoice_fee: 0,
        consignee: '',
        address: '',
        region_ids: '[]',
        region_names: '[]',
        mobile: '',
        email: '',
        buyer_note: dto.remark || '',
        admin_note: '',
        shipping_method: 1,
        logistics_id: 0,
        logistics_name: '',
        shipping_type_id: 0,
        shipping_type_name: '',
        tracking_no: '',
        shipping_time: 0,
        received_time: 0,
        pay_type_id: 0,
        pay_time: 0,
        use_points: 0,
        is_need_commisson: false,
        distribution_status: false,
        referrer_user_id: 0,
        is_del: 0,
        is_store_splited: 0,
        comment_status: 0,
        },
      });
      // 插入订单商品 + 扣减库存
      for (const item of itemsInput) {
        const prod = prodMap.get(item.productId);
        await tx.order_item.create({ data: {
          order_id: order.order_id,
          order_sn: order.order_sn,
          user_id: userId,
          price: prod.product_price,
          quantity: item.quantity,
          product_id: prod.product_id,
          product_name: prod.product_name,
          product_sn: prod.product_sn,
          pic_thumb: prod.pic_thumb,
          sku_id: item.skuId || 0,
          sku_data: '[]',
          delivery_quantity: 0,
          product_type: 1,
          is_gift: 0,
          shop_id: shopId,
          is_pin: 0,
          prepay_price: 0,
          commission: '',
          origin_price: prod.product_price,
          promotion_data: null,
          is_seckill: 0,
          extra_sku_data: null,
          suppliers_id: 0,
          card_group_name: '',
          vendor_product_id: null,
          vendor_product_sku_id: null,
          vendor_id: null,
        }});
        // 原子扣减库存（SKU / product）
        if (item.skuId) {
          const affected = await tx.$executeRaw`UPDATE product_sku SET sku_stock = sku_stock - ${Number(item.quantity)} WHERE sku_id=${Number(item.skuId)} AND sku_stock >= ${Number(item.quantity)}`;
          if (affected !== 1) throw new BadRequestException('规格库存不足');
        }
        const affectedProd = await tx.$executeRaw`UPDATE product SET product_stock = product_stock - ${Number(item.quantity)} WHERE product_id=${prod.product_id} AND product_stock >= ${Number(item.quantity)}`;
        if (affectedProd !== 1) throw new BadRequestException('商品库存不足');
      }
  await tx.order_log.create({ data: { order_id: order.order_id, order_sn: order.order_sn, user_id: userId, shop_id: shopId, admin_id: 0, description: JSON.stringify({ event: LogEvent.CREATE, dineScene: extension.dineScene }), log_time: now } });
      return order;
    });
    // 推送创建事件
    try {
      if (idemKey) { // 将占位符替换为真实 orderId
        await this.redis['redis'].set(idemKey, String(created.order_id), 'EX', 300);
      }
      const extState = extractServiceState(extension);
      this.events.emit({ kind: 'CREATE', orderId: created.order_id, rootOrderId: created.order_id, shopId, userId, serviceState: extState, dineScene: extension.dineScene, tableNo: created.table_no, pickupNo: created.pickup_no, orderType: created.order_type, amount: created.total_amount });
    } catch {}
    return created;
  }

  private genSn() {
    const d = new Date();
    return [
      d.getFullYear(),
      (d.getMonth()+1).toString().padStart(2,'0'),
      d.getDate().toString().padStart(2,'0'),
      d.getHours().toString().padStart(2,'0'),
      d.getMinutes().toString().padStart(2,'0'),
      d.getSeconds().toString().padStart(2,'0'),
      Math.floor(Math.random()*1000).toString().padStart(3,'0')
    ].join('');
  }

  // ============ 加单 ============
  async append(userId: number, parentOrderId: number, items: {productId:number;quantity:number;skuId?:number}[], idemToken?: string) {
    const parent = await this.prisma.order.findUnique({ where: { order_id: parentOrderId } });
    if (!parent) throw new NotFoundException('主订单不存在');
    const shopId = parent.shop_id;
    const idemKey = this.buildIdemKey('append', userId, shopId, idemToken ? `${parentOrderId}:${idemToken}` : undefined);
    if (idemKey) {
      const first = await this.enterIdempotency(idemKey);
      if (!first) {
        const val = await this.getIdemResult(idemKey);
        if (val && /^\d+$/.test(val)) {
          const existed = await this.prisma.order.findUnique({ where: { order_id: Number(val) } });
          if (existed) return existed;
        }
        const recent = await this.prisma.order.findFirst({ where: { parent_order_id: parent.order_id }, orderBy: { order_id: 'desc' } });
        if (recent) return recent;
      }
    }
    if (![2,3].includes(Number(parent.order_type))) throw new BadRequestException('非堂食/外带订单不支持加单');
    const ext = this.safeJson(parent.order_extension) || {};
    if (ext.serviceState && ['COMPLETED','CANCELED'].includes(ext.serviceState)) throw new BadRequestException('订单已结束不可加单');
    const user = parent.user_id;

    // 金额计算
    const ids = items.map(i=>i.productId);
    const products = ids.length ? await this.prisma.product.findMany({ where: { product_id: { in: ids as any } } }) : [];
    const map = new Map<number, any>(); products.forEach(p=>map.set(p.product_id,p));
    let productAmount = 0;
    for (const it of items) {
      const p = map.get(it.productId); if(!p) throw new BadRequestException(`商品不存在:${it.productId}`);
      productAmount += Number(p.product_price) * Number(it.quantity);
    }
    const totalAmount = productAmount;
    const unpaidAmount = totalAmount;
    const now = Math.floor(Date.now()/1000);
    const orderSn = this.genSn();
    const childExt = { ...(ext||{}), isAppend: true, parentOrderId: parent.order_id };
    const child = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data: {
      order_sn: orderSn,
      user_id: user,
      shop_id: shopId,
      order_type: parent.order_type,
      parent_order_id: parent.order_id,
      parent_order_sn: parent.order_sn,
      add_time: now,
      order_extension: JSON.stringify(childExt),
      order_source: parent.order_source,
      table_no: parent.table_no,
      pickup_day: parent.pickup_day,
      pickup_no: parent.pickup_no,
      total_amount: totalAmount,
      product_amount: productAmount,
      unpaid_amount: unpaidAmount,
      paid_amount: 0,
      unrefund_amount: 0,
      coupon_amount: 0,
      points_amount: 0,
      discount_amount: 0,
      balance: 0,
      online_paid_amount: 0,
      offline_paid_amount: 0,
      service_fee: 0,
      shipping_fee: 0,
      invoice_fee: 0,
      consignee: parent.consignee,
      address: parent.address,
      region_ids: parent.region_ids,
      region_names: parent.region_names,
      mobile: parent.mobile,
      email: parent.email,
      buyer_note: '',
      admin_note: '',
      shipping_method: 1,
      logistics_id: 0,
      logistics_name: '',
      shipping_type_id: 0,
      shipping_type_name: '',
      tracking_no: '',
      shipping_time: 0,
      received_time: 0,
      pay_type_id: 0,
      pay_time: 0,
      use_points: 0,
      is_need_commisson: false,
      distribution_status: false,
      referrer_user_id: 0,
      is_del: 0,
      is_store_splited: 0,
      comment_status: 0,
      }});
      for (const it of items) {
        const p = map.get(it.productId);
        await tx.order_item.create({ data: {
          order_id: order.order_id,
          order_sn: order.order_sn,
          user_id: user,
          price: p.product_price,
          quantity: it.quantity,
          product_id: p.product_id,
          product_name: p.product_name,
          product_sn: p.product_sn,
          pic_thumb: p.pic_thumb,
          sku_id: it.skuId || 0,
          sku_data: '[]',
          delivery_quantity: 0,
          product_type: 1,
          is_gift: 0,
          shop_id: shopId,
          is_pin: 0,
          prepay_price: 0,
          commission: '',
          origin_price: p.product_price,
          promotion_data: null,
          is_seckill: 0,
          extra_sku_data: null,
          suppliers_id: 0,
          card_group_name: '',
          vendor_product_id: null,
          vendor_product_sku_id: null,
          vendor_id: null,
        }});
        if (it.skuId) {
          const affectedSku = await tx.$executeRaw`UPDATE product_sku SET sku_stock = sku_stock - ${Number(it.quantity)} WHERE sku_id=${Number(it.skuId)} AND sku_stock >= ${Number(it.quantity)}`;
          if (affectedSku !== 1) throw new BadRequestException('规格库存不足');
        }
        const affectedProd = await tx.$executeRaw`UPDATE product SET product_stock = product_stock - ${Number(it.quantity)} WHERE product_id=${p.product_id} AND product_stock >= ${Number(it.quantity)}`;
        if (affectedProd !== 1) throw new BadRequestException('商品库存不足');
      }
  await tx.order_log.create({ data: { order_id: order.order_id, order_sn: order.order_sn, user_id: user, shop_id: shopId, admin_id: 0, description: JSON.stringify({ event: LogEvent.APPEND, parentOrderId: parent.order_id }), log_time: now } });
      return order;
    });
    try {
      if (idemKey) await this.redis['redis'].set(idemKey, String(child.order_id), 'EX', 300);
      this.events.emit({ kind: 'APPEND', orderId: child.order_id, rootOrderId: parent.parent_order_id ? parent.parent_order_id : parent.order_id, parentOrderId: parent.order_id, shopId, userId: user, dineScene: ext.dineScene, tableNo: child.table_no, pickupNo: child.pickup_no, orderType: child.order_type, amount: child.total_amount });
    } catch {}
    return child;
  }

  // ============ 换桌 ============
  async changeTable(orderId: number, newTableNo: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.order_type) !== 2) throw new BadRequestException('只有堂食订单可换桌');
    const updated = await this.prisma.order.update({ where: { order_id: orderId }, data: { table_no: newTableNo } });
  await this.log(order.order_id, order.order_sn, order.user_id, order.shop_id, { event: LogEvent.CHANGE_TABLE, from: order.table_no, to: newTableNo });
    try { this.events.emit({ kind: 'CHANGE_TABLE', orderId: order.order_id, rootOrderId: order.parent_order_id? order.parent_order_id : order.order_id, shopId: order.shop_id, userId: order.user_id, tableNo: newTableNo }); } catch {}
    return updated;
  }

  // ============ 状态流转(仅扩展 JSON) ============
  async updateServiceState(orderId: number, to: string) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    const ext = this.safeJson(order.order_extension) || {};
    const from = ext.serviceState || 'CREATED';
    const allowed = AllowedTransitions as any;
    if (!allowed[from]) throw new BadRequestException('未知原状态');
    if (from === to) return { ok: true };
    if (!allowed[from].includes(to)) throw new BadRequestException(`状态不允许从 ${from} -> ${to}`);
    ext.serviceState = to;
    const maybeStatus = ServiceStateToOrderStatus[to as ServiceState];
    const upd: any = { order_extension: JSON.stringify(ext) };
    if (typeof maybeStatus !== 'undefined') upd.order_status = maybeStatus;
    await this.prisma.order.update({ where: { order_id: orderId }, data: upd });
    await this.log(order.order_id, order.order_sn, order.user_id, order.shop_id, { event: LogEvent.STATE_CHANGE, from, to });
    try { this.events.emit({ kind: 'STATE_CHANGE', orderId: order.order_id, rootOrderId: order.parent_order_id? order.parent_order_id: order.order_id, shopId: order.shop_id, userId: order.user_id, serviceState: to, tableNo: order.table_no, pickupNo: order.pickup_no, orderType: order.order_type }); } catch {}
    return { ok: true };
  }

  // ============ 叫号队列 ============
  async queue(shopId: number, day: number) {
    const where: any = { shop_id: shopId, pickup_day: day };
    const list = await this.prisma.order.findMany({ where, orderBy: { pickup_no: 'asc' }, take: 200 });
    const active = list.filter(o => {
      const ext = this.safeJson(o.order_extension);
      const state = extractServiceState(ext);
      if (state === ServiceState.COMPLETED || state === ServiceState.CANCELED) return false;
      if (Number(o.order_status) === 4) return false;
      return true;
    });
    return { records: active.map(o => { const ext = this.safeJson(o.order_extension); return ({ orderId: o.order_id, pickupNo: o.pickup_no, tableNo: o.table_no, orderType: o.order_type, serviceState: extractServiceState(ext) }); }) };
  }

  // ============ 支付（模拟） ============
  async pay(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.user_id !== userId) throw new BadRequestException('无权限');
  if (Number(order.pay_status) === 1) return { ok: true, paid: true };
    if (Number(order.order_status) === 4) throw new BadRequestException('订单已取消');
    const ext = this.safeJson(order.order_extension) || {};
    const now = Math.floor(Date.now()/1000);
    // 假定 0=pending,1=confirmed,4=cancel,5=completed
    ext.serviceState = ext.serviceState === ServiceState.CREATED ? ServiceState.IN_PROGRESS : ext.serviceState;
    const updated = await this.prisma.order.update({ where: { order_id: orderId }, data: {
      pay_status: 1,
      order_status: ServiceStateToOrderStatus[extractServiceState(ext)],
      pay_time: now,
      paid_amount: order.total_amount,
      unpaid_amount: 0,
      order_extension: JSON.stringify(ext),
    }});
    await this.log(order.order_id, order.order_sn, order.user_id, order.shop_id, { event: LogEvent.PAY, amount: order.total_amount });
    try { this.events.emit({ kind: 'PAY', orderId: order.order_id, rootOrderId: order.parent_order_id? order.parent_order_id: order.order_id, shopId: order.shop_id, userId: order.user_id, serviceState: extractServiceState(ext), amount: order.total_amount, tableNo: order.table_no, pickupNo: order.pickup_no, orderType: order.order_type }); } catch {}
    return { ok: true };
  }

  // ============ 取消（未支付） ============
  async cancel(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.user_id !== userId) throw new BadRequestException('无权限');
    if (Number(order.pay_status) === 1) throw new BadRequestException('已支付订单需申请退款');
    if (Number(order.order_status) === 4) return { ok: true, canceled: true };
    const ext = this.safeJson(order.order_extension) || {};
  if ([ServiceState.COMPLETED, ServiceState.CANCELED].includes(ext.serviceState)) return { ok: true };
    const items = await this.prisma.order_item.findMany({ where: { order_id: order.order_id } });
    await this.prisma.$transaction(async (tx) => {
      // 回滚库存
      for (const it of items) {
        if (it.sku_id) {
          await tx.product_sku.update({ where: { sku_id: Number(it.sku_id) }, data: { sku_stock: { increment: Number(it.quantity) } as any } });
        }
        await tx.product.updateMany({ where: { product_id: Number(it.product_id) }, data: { product_stock: { increment: Number(it.quantity) } as any } });
      }
      ext.serviceState = ServiceState.CANCELED;
      await tx.order.update({ where: { order_id: orderId }, data: { order_status: ServiceStateToOrderStatus[ServiceState.CANCELED], order_extension: JSON.stringify(ext) } });
      await tx.order_log.create({ data: { order_id: order.order_id, order_sn: order.order_sn, user_id: order.user_id, shop_id: order.shop_id, admin_id: 0, description: JSON.stringify({ event: LogEvent.CANCEL }), log_time: Math.floor(Date.now()/1000) } });
    });
    try { this.events.emit({ kind: 'CANCEL', orderId: order.order_id, rootOrderId: order.parent_order_id? order.parent_order_id: order.order_id, shopId: order.shop_id, userId: order.user_id, serviceState: ServiceState.CANCELED, tableNo: order.table_no, pickupNo: order.pickup_no, orderType: order.order_type }); } catch {}
    return { ok: true };
  }

  // ============ 详情（含主单+加单聚合） ============
  async detail(orderId: number, userId: number) {
    const base = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!base) throw new NotFoundException('订单不存在');
    if (base.user_id !== userId) throw new BadRequestException('无权限');
    // 找主单
    const root = base.parent_order_id ? await this.prisma.order.findUnique({ where: { order_id: base.parent_order_id } }) : base;
    const children = await this.prisma.order.findMany({ where: { OR: [ { order_id: root.order_id }, { parent_order_id: root.order_id } ] } });
    const orderIds = children.map(o=>o.order_id);
    const items = await this.prisma.order_item.findMany({ where: { order_id: { in: orderIds as any } } });
    // 聚合商品
    const aggMap = new Map<string, { productId:number; skuId:number; name:string; quantity:number; price:number }>();
    for (const it of items) {
      const key = `${it.product_id}:${it.sku_id}`;
      if (!aggMap.has(key)) aggMap.set(key, { productId: Number(it.product_id), skuId: Number(it.sku_id||0), name: it.product_name, quantity: 0, price: Number(it.price) });
      aggMap.get(key)!.quantity += Number(it.quantity);
    }
    const extRoot = this.safeJson(root.order_extension) || {};
    return {
      rootOrderId: root.order_id,
      serviceState: extRoot.serviceState,
      dineScene: extRoot.dineScene,
      tableNo: root.table_no,
      pickupNo: root.pickup_no,
      orders: children.map(o=>({ id:o.order_id, isAppend: this.safeJson(o.order_extension).isAppend || false, totalAmount: o.total_amount, status:o.order_status })),
      items: Array.from(aggMap.values()),
    };
  }

  // Root summary (主单聚合金额 + 商品 + 子单拆分)
  async rootSummary(orderId: number, userId: number) {
    const base = await this.prisma.order.findUnique({ where: { order_id: orderId } });
    if (!base) throw new NotFoundException('订单不存在');
    const root = base.parent_order_id ? await this.prisma.order.findUnique({ where: { order_id: base.parent_order_id } }) : base;
    if (!root) throw new NotFoundException('主订单丢失');
    if (root.user_id !== userId) throw new BadRequestException('无权限');
    const orders = await this.prisma.order.findMany({ where: { OR: [ { order_id: root.order_id }, { parent_order_id: root.order_id } ] } });
    const ids = orders.map(o=>o.order_id);
    const items = await this.prisma.order_item.findMany({ where: { order_id: { in: ids as any } } });
    const totalProduct = orders.reduce((sum,o)=> sum + Number(o.product_amount), 0);
    const totalAmount = orders.reduce((sum,o)=> sum + Number(o.total_amount), 0);
    const unpaid = orders.reduce((sum,o)=> sum + Number(o.unpaid_amount), 0);
    const paid = orders.reduce((sum,o)=> sum + Number(o.paid_amount), 0);
    const aggregated: Record<string,{productId:number;skuId:number;name:string;quantity:number;price:number}> = {};
    for (const it of items) {
      const key = `${it.product_id}:${it.sku_id}`;
      if (!aggregated[key]) aggregated[key] = { productId: Number(it.product_id), skuId: Number(it.sku_id||0), name: it.product_name, quantity: 0, price: Number(it.price) };
      aggregated[key].quantity += Number(it.quantity);
    }
    const rootExt = this.safeJson(root.order_extension) || {};
    return {
      rootOrderId: root.order_id,
      serviceState: rootExt.serviceState,
      dineScene: rootExt.dineScene,
      tableNo: root.table_no,
      pickupNo: root.pickup_no,
      orderType: root.order_type,
      orders: orders.map(o=>({ id:o.order_id, isAppend: o.parent_order_id?true:false, productAmount: o.product_amount, totalAmount: o.total_amount, unpaidAmount: o.unpaid_amount, paidAmount: o.paid_amount })),
      totals: { productAmount: totalProduct, totalAmount, paidAmount: paid, unpaidAmount: unpaid },
      items: Object.values(aggregated),
    };
  }

  private safeJson(s: any) { try { return typeof s === 'object' ? s : JSON.parse(String(s||'{}')); } catch { return {}; } }
  private async log(orderId: number, orderSn: string, userId: number, shopId: number, payload: any) {
    await this.prisma.order_log.create({ data: { order_id: orderId, order_sn: orderSn, user_id: userId, shop_id: shopId, admin_id: 0, description: JSON.stringify(payload), log_time: Math.floor(Date.now()/1000) } });
  }
}
