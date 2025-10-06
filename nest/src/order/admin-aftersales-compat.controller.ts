// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { AuthorityGuard } from 'src/auth/guards/authority.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { Authorities } from 'src/auth/decorators/authority.decorator';

// 状态名称与类型名称映射（依据用户端实现 / 参考给出的示例）
const AFTERSALES_TYPE_NAME: Record<number,string> = {
  1: '退货/退款', // 示例中 type=1 => 退货/退款
  2: '仅退款',   // 示例中 type=2 => 仅退款
};

// 结合示例： status 1=审核处理中,6=已完成,5=待商家收货,7=已取消,22=待供应商收货(示例推断)
// 这里先做一个映射，未知状态保持数字字符串或“处理中”占位
const STATUS_NAME: Record<number,string> = {
  1: '审核处理中',
  5: '待商家收货',
  6: '已完成',
  7: '已取消',
  22: '待供应商收货',
};

function formatTime(ts?: any) {
  if (!ts) return null;
  const n = Number(ts);
  if (!n) return null;
  return new Date(n * 1000).toISOString().slice(0,19).replace('T',' ');
}

@ApiTags('Admin Aftersales（兼容）')
@Controller('adminapi/order/aftersales')
// 需要同时启用 AdminJwtAuthGuard 和 AuthorityGuard 以支持权限校验
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminAftersalesCompatController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /adminapi/order/aftersales/list
   * 兼容返回结构：{ code,message,data:{records,total,size,current,pages} }
   */
  @Get('list')
  @ApiOperation({ summary: '售后列表（兼容）' })
  @Authorities('orderAftersalesManage')
  async list(@Query() query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query.size) || 15));
    const skip = (page - 1) * size;

    // 可选过滤：status, type, orderSn, aftersalesSn, userId
    const where: any = {};
    if (query.status !== undefined && query.status !== '') {
      where.status = Number(query.status);
    }
    if (query.aftersale_type !== undefined && query.aftersale_type !== '') {
      where.aftersale_type = Number(query.aftersale_type);
    }
    if (query.aftersalesSn || query.aftersales_sn) {
      where.aftersales_sn = String(query.aftersalesSn || query.aftersales_sn);
    }
    if (query.userId || query.user_id) {
      where.user_id = Number(query.userId || query.user_id);
    }
    if (query.orderSn || query.order_sn) {
      // orderSn 在 aftersales 里没有直接字段，仅可通过 order_id 间接，需要 JOIN；为保持简洁先忽略或后续扩展。
    }

    const [total, rows] = await Promise.all([
      this.prisma.aftersales.count({ where }),
      this.prisma.aftersales.findMany({ where, skip, take: size, orderBy: { aftersale_id: 'desc' } }),
    ]);

    // 取出关联的 aftersales_item & order_item & order 基础字段
    const aftersaleIds = rows.map(r => r.aftersale_id);
    const items = aftersaleIds.length ? await this.prisma.aftersales_item.findMany({ where: { aftersale_id: { in: aftersaleIds } } }) : [];
    const orderItemIds = items.map(i => i.order_item_id).filter(Boolean) as number[];
    const orderItems = orderItemIds.length ? await (this.prisma as any).order_item.findMany({
      where: { item_id: { in: orderItemIds } },
      select: { item_id: true, order_id: true, product_name: true, product_id: true, product_sn: true, pic_thumb: true, price: true, quantity: true }
    }) : [];
    const orderIds = Array.from(new Set(orderItems.map(oi => oi.order_id).filter(Boolean)));
    const orders = orderIds.length ? await (this.prisma as any).order.findMany({
      where: { order_id: { in: orderIds } },
      select: { order_id: true, order_sn: true, shop_id: true, vendor_id: true }
    }) : [];
    const orderMap = new Map(orders.map(o => [o.order_id, o]));
  const orderItemMap = new Map(orderItems.map(oi => [oi.item_id, oi]));

    const records = rows.map(r => {
      const relatedItems = items.filter(i => i.aftersale_id === r.aftersale_id).map(it => {
        const oi = orderItemMap.get(it.order_item_id || 0);
        return {
          aftersalesItemId: it.aftersales_item_id,
          orderItemId: it.order_item_id,
            number: it.number,
          aftersaleId: it.aftersale_id,
          orderSn: oi ? orderMap.get(oi.order_id)?.order_sn : undefined,
          productName: oi?.product_name,
          orderId: oi?.order_id,
          picThumb: oi?.pic_thumb || null,
          productSn: oi?.product_sn,
          productId: oi?.product_id,
          quantity: oi?.quantity,
          price: oi?.price ? Number(oi.price) : 0,
        };
      });
      return {
        aftersaleId: r.aftersale_id,
        aftersalesName: null,
        aftersalesPic: null,
        sortOrder: null,
        isShow: null,
        status: r.status,
        addTime: formatTime(r.add_time) || null,
        aftersaleReason: r.aftersale_reason,
        aftersaleType: r.aftersale_type,
        aftersalesItems: relatedItems,
        aftersalesLog: null, // 需要时再补充日志明细
        aftersalesSn: r.aftersales_sn,
        aftersalesTypeName: AFTERSALES_TYPE_NAME[r.aftersale_type] || '',
        auditTime: r.audit_time ? formatTime(r.audit_time) : null,
        dealTime: r.deal_time ? formatTime(r.deal_time) : null,
        description: r.description || '',
        finalTime: r.final_time ? formatTime(r.final_time) : null,
        logisticsName: r.logistics_name || '',
        orderId: r.order_id || 0,
        orderSn: r.order_id ? orderMap.get(r.order_id)?.order_sn : undefined,
        pics: r.pics || null,
        refundAmount: Number(r.refund_amount || 0) || null,
        reply: r.reply || '',
        returnAddress: r.return_address || null,
        shopId: r.shop_id || 0,
        statusName: STATUS_NAME[r.status] || '处理中',
        trackingNo: r.tracking_no || '',
        userId: r.user_id || 0,
        suggestRefundAmount: (() => {
          if (!relatedItems.length) return null;
          const first = relatedItems[0];
          return Number((first.price || 0) * (first.quantity || 0)) || null;
        })(),
        vendorId: r.vendor_id || null,
      };
    });

    return {
      code: 0,
      message: 'success',
      data: {
        records,
        total,
        size,
        current: page,
        pages: Math.ceil(total / size),
      },
    };
  }

  /**
   * GET /adminapi/order/aftersales/detail?id=xxx
   * 返回与示例一致的结构（单条）
   */
  @Get('detail')
  @ApiOperation({ summary: '售后详情（兼容）' })
  @Authorities('orderAftersalesManage')
  async detail(@Query('id') id: string) {
    const aftersaleId = Number(id);
    if (!aftersaleId) throw new BadRequestException('id 参数无效');
    const r = await this.prisma.aftersales.findUnique({ where: { aftersale_id: aftersaleId } });
    if (!r) return { code: 1, message: '记录不存在', data: null };

    const items = await this.prisma.aftersales_item.findMany({ where: { aftersale_id: aftersaleId } });
    const orderItemIds = items.map(i => i.order_item_id).filter(Boolean) as number[];
    const orderItems = orderItemIds.length ? await (this.prisma as any).order_item.findMany({
      where: { item_id: { in: orderItemIds } },
      select: { item_id: true, order_id: true, product_name: true, product_id: true, product_sn: true, pic_thumb: true, price: true, quantity: true }
    }) : [];
    const orderIds = Array.from(new Set(orderItems.map(oi => oi.order_id).filter(Boolean)));
    const orders = orderIds.length ? await (this.prisma as any).order.findMany({
      where: { order_id: { in: orderIds } },
      select: { order_id: true, order_sn: true, shop_id: true, vendor_id: true }
    }) : [];
    const orderMap = new Map(orders.map(o => [o.order_id, o]));
    const orderItemMap = new Map(orderItems.map(oi => [oi.item_id, oi]));

    const relatedItems = items.map(it => {
      const oi = orderItemMap.get(it.order_item_id || 0);
      return {
        aftersalesItemId: it.aftersales_item_id,
        orderItemId: it.order_item_id,
        number: it.number,
        aftersaleId: it.aftersale_id,
        orderSn: oi ? orderMap.get(oi.order_id)?.order_sn : undefined,
        productName: oi?.product_name,
        orderId: oi?.order_id,
        picThumb: oi?.pic_thumb || null,
        productSn: oi?.product_sn,
        productId: oi?.product_id,
        quantity: oi?.quantity,
        price: oi?.price ? Number(oi.price) : 0,
      };
    });

    // 日志
    const logs = await this.prisma.aftersales_log.findMany({ where: { aftersale_id: aftersaleId }, orderBy: { log_id: 'asc' } });
    const aftersalesLog = logs.map(l => ({
      logId: l.log_id,
      adminName: l.admin_name || '',
      aftersalesId: l.aftersale_id || null,
      returnPic: l.return_pic || null,
      logInfo: l.log_info,
      refundDesc: l.refund_desc,
      refundMoney: Number(l.refund_money || 0),
      refundType: l.refund_type,
      userName: l.user_name || '',
      addTime: formatTime(l.add_time) || null,
      shopId: 0,
      vendorId: 0,
    }));

    const data = {
      aftersaleId: r.aftersale_id,
      aftersalesName: null,
      aftersalesPic: null,
      sortOrder: null,
      isShow: null,
      status: r.status,
      addTime: formatTime(r.add_time) || null,
      aftersaleReason: r.aftersale_reason,
      aftersaleType: r.aftersale_type,
      aftersalesItems: relatedItems,
      aftersalesLog,
      aftersalesSn: r.aftersales_sn || null,
      aftersalesTypeName: AFTERSALES_TYPE_NAME[r.aftersale_type] || '',
      auditTime: r.audit_time ? formatTime(r.audit_time) : null,
      dealTime: r.deal_time ? formatTime(r.deal_time) : null,
      description: r.description || '',
      finalTime: r.final_time ? formatTime(r.final_time) : null,
      logisticsName: r.logistics_name || '',
      orderId: r.order_id || 0,
      orderSn: null, // 示例中为 null
      pics: r.pics || null,
      refundAmount: Number(r.refund_amount || 0) || null,
      reply: r.reply || '',
      returnAddress: r.return_address || null,
      shopId: r.shop_id || 0,
      statusName: STATUS_NAME[r.status] || '处理中',
      trackingNo: r.tracking_no || '',
      userId: r.user_id || 0,
      suggestRefundAmount: (() => {
        if (!relatedItems.length) return null;
        const first = relatedItems[0];
        return Number((first.price || 0) * (first.quantity || 0)) || null;
      })(),
      vendorId: r.vendor_id || null,
    };

    return { code: 0, message: 'success', data };
  }

  /**
   * POST /adminapi/order/aftersales/update
   * 更新售后：支持修改 status / refundAmount / reply / returnAddress
   * 对齐旧 PHP：变更写入对应时间字段，并追加日志
   * body: { id, status?, refundAmount?, reply?, returnAddress? }
   */
  @Post('update')
  @ApiOperation({ summary: '更新售后（兼容）' })
  @Authorities('orderAftersalesManage')
  async update(@Body() body: any) {
    const id = Number(body.id || body.aftersaleId || body.aftersale_id);
    if (!id) throw new BadRequestException('id 必填');
    const record = await this.prisma.aftersales.findUnique({ where: { aftersale_id: id } });
    if (!record) return { code: 1, message: '记录不存在', data: null };

    const data: any = {};
    const now = Math.floor(Date.now() / 1000);
    let logInfoParts: string[] = [];

    if (body.status !== undefined) {
      const newStatus = Number(body.status);
      if (newStatus !== record.status) {
        data.status = newStatus;
        // 时间字段处理（简化）：
        // status=1 -> 审核处理中：记录 audit_time
        // status=5/22 -> 待收货：记录 deal_time（若未记录）
        // status=6 -> 已完成：记录 final_time
        // status=7 -> 已取消：记录 final_time
        if (newStatus === 1) data.audit_time = now;
        if ([5, 22].includes(newStatus) && !record.deal_time) data.deal_time = now;
        if ([6, 7].includes(newStatus)) data.final_time = now;
        logInfoParts.push(`状态 ${record.status} -> ${newStatus}`);
      }
    }

    if (body.refundAmount !== undefined || body.refund_amount !== undefined) {
      const refundAmount = Number(body.refundAmount ?? body.refund_amount);
      if (!Number.isNaN(refundAmount) && refundAmount !== Number(record.refund_amount)) {
        data.refund_amount = refundAmount;
        logInfoParts.push(`退款金额 ${record.refund_amount} -> ${refundAmount}`);
      }
    }

    if (body.reply !== undefined) {
      const reply = body.reply?.toString() || '';
      if (reply !== record.reply) {
        data.reply = reply;
        logInfoParts.push('更新商家回复');
      }
    }

    if (body.returnAddress !== undefined || body.return_address !== undefined) {
      const addr = body.returnAddress ?? body.return_address;
      if (addr !== record.return_address) {
        data.return_address = addr || null;
        logInfoParts.push('更新退货地址');
      }
    }

    if (Object.keys(data).length === 0) {
      return { code: 0, message: '无变更', data: true };
    }

    const updated = await this.prisma.aftersales.update({ where: { aftersale_id: id }, data });

    // 写日志（若有变更）
    if (logInfoParts.length) {
      try {
        await this.prisma.aftersales_log.create({
          data: {
            aftersale_id: id,
            log_info: logInfoParts.join('；'),
            add_time: now,
            admin_name: '',
            refund_money: 0,
            refund_type: 0,
            refund_desc: logInfoParts.join('；'),
            user_name: '',
            return_pic: null,
          },
        });
      } catch {}
    }

    return { code: 0, message: 'success', data: true };
  }

  /**
   * POST /adminapi/order/aftersales/record
   * 兼容：新增售后日志（aftersales_log）与 PHP 行为对齐。
   * 入参示例：{ aftersaleId, logInfo, returnPic:[] }
   * 返回：{ code,message,data:true }
   */
  @Post('record')
  @ApiOperation({ summary: '新增售后日志（兼容）' })
  @Authorities('orderAftersalesManage')
  async addRecord(@Body() body: any) {
    const aftersaleId = Number(body.aftersaleId || body.id);
    if (!aftersaleId) throw new BadRequestException('aftersaleId 必填');
    const logInfo = (body.logInfo || body.log_info || body.remark || body.note || body.desc || '').toString();
    const returnPicInput = body.returnPic || body.return_pic || [];
    const returnPic = Array.isArray(returnPicInput) ? (returnPicInput.length ? JSON.stringify(returnPicInput) : null) : (typeof returnPicInput === 'string' ? returnPicInput : null);
    // refundDesc / desc / refund_desc / remark 兼容
    let refundDesc = body.refundDesc || body.refund_desc || body.desc || body.remark || '';
    if (!refundDesc && logInfo) refundDesc = logInfo; // 若未单独提供则回落到 logInfo

    const exists = await this.prisma.aftersales.findUnique({ where: { aftersale_id: aftersaleId } });
    if (!exists) return { code: 1, message: '售后记录不存在', data: null };

    const now = Math.floor(Date.now() / 1000);
    await this.prisma.aftersales_log.create({
      data: {
        aftersale_id: aftersaleId,
        log_info: logInfo || '操作记录',
        add_time: now,
        admin_name: '', // 暂无管理员名称上下文
        refund_money: 0,
        refund_type: 0,
        refund_desc: refundDesc || '',
        user_name: '',
        return_pic: returnPic,
      },
    });

    return { code: 0, message: 'success', data: true };
  }
}
