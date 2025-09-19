import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefundApply } from '../entities/refund-apply.entity';
import { Aftersales } from '../../order/entities/aftersales.entity';
import { Order } from '../../order/entities/order.entity';
import { AftersalesItem } from '../../order/entities/aftersales-item.entity';
import { RefundLog } from '../entities/refund-log.entity';
import { User } from '../../user/entities/user.entity';
import { ProductSku } from '../../product/sku/entities/sku.entity';
import { Product } from '../../product/entities/product.entity';
import { Seckill } from '../../promotion/entities/seckill.entity';
import { RefundApplyQueryDto, RefundApplyAuditDto, RefundApplyOfflineAuditDto } from './dto/refund-apply.dto';
import { RefundStatus, RefundType } from './dto/refund-apply.dto';

@Injectable()
export class RefundApplyService {
  constructor(
    @InjectRepository(RefundApply)
    private refundApplyRepository: Repository<RefundApply>,
    @InjectRepository(Aftersales)
    private aftersalesRepository: Repository<Aftersales>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(AftersalesItem)
    private aftersalesItemRepository: Repository<AftersalesItem>,
    @InjectRepository(RefundLog)
    private refundLogRepository: Repository<RefundLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProductSku)
    private productSkuRepository: Repository<ProductSku>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Seckill)
    private seckillRepository: Repository<Seckill>,
  ) {}

  // 获取退款状态名称映射
  getRefundStatusList() {
    return {
      [RefundStatus.WAIT]: '等待处理',
      [RefundStatus.PROCESSED]: '已处理',
      [RefundStatus.FAILED]: '失败',
    };
  }

  // 获取退款类型名称映射
  getRefundTypeNameMap() {
    return {
      [RefundType.ONLINE]: '线上退款',
      [RefundType.BALANCE]: '余额退款',
      [RefundType.OFFLINE]: '线下退款',
    };
  }

  // 构建筛选查询
  buildFilterQuery(queryDto: RefundApplyQueryDto) {
    const query = this.refundApplyRepository.createQueryBuilder('refund_apply')
      .leftJoinAndSelect('refund_apply.aftersales', 'aftersales');

    if (queryDto.keyword) {
      query.andWhere('aftersales.aftersales_sn LIKE :keyword', {
        keyword: `%${queryDto.keyword}%`
      });
    }

    if (queryDto.refund_status !== undefined && queryDto.refund_status !== -1) {
      query.andWhere('refund_apply.refund_status = :refund_status', {
        refund_status: queryDto.refund_status
      });
    }

    if (queryDto.sort_field && queryDto.sort_order) {
      query.orderBy(`refund_apply.${queryDto.sort_field}`, queryDto.sort_order);
    }

    return query;
  }

  // 获取筛选结果
  async getFilterResult(queryDto: RefundApplyQueryDto) {
    const query = this.buildFilterQuery(queryDto);

    const skip = (queryDto.page - 1) * queryDto.size;
    const results = await query.skip(skip).take(queryDto.size).getMany();

    // 添加附加属性
    return results.map(refund => ({
      ...refund,
      refund_type_name: this.getRefundTypeNameMap()[refund.refund_type] || '',
      refund_status_name: this.getRefundStatusList()[refund.refund_status] || '',
    }));
  }

  // 获取筛选结果数量
  async getFilterCount(queryDto: RefundApplyQueryDto) {
    const query = this.buildFilterQuery(queryDto);
    return query.getCount();
  }

  // 获取详情
  async getDetail(id: number) {
    const refund = await this.refundApplyRepository.findOne({
      where: { refund_id: id },
      relations: [
        'aftersales',
        'aftersales.orders',
        'order_info',
        'items'
      ],
    });

    if (!refund) {
      throw new Error('退款申请不存在');
    }

    const order = await this.orderRepository.findOne({
      where: { order_id: refund.order_id }
    });

    // 计算退款商品总价格
    let price = 0;
    for (const item of refund.items) {
      const aftersalesItem = await this.aftersalesItemRepository.findOne({
        where: {
          order_item_id: item.item_id,
          aftersale_id: refund.aftersales.aftersale_id
        }
      });
      item.number = aftersalesItem?.number || 0;
      price += item.price * item.number;
    }

    // 计算已完成退款金额
    const completeResult = await this.refundApplyRepository
      .createQueryBuilder('refund')
      .select([
        'SUM(refund.refund_balance) as complete_balance',
        'SUM(refund.online_balance) as complete_online_balance',
        'SUM(refund.offline_balance) as complete_offline_balance'
      ])
      .where('refund.order_id = :orderId', { orderId: refund.order_id })
      .andWhere('refund.refund_status IN (:...statuses)', {
        statuses: [RefundStatus.PROCESSED, RefundStatus.FAILED]
      })
      .getRawOne();

    const totalCompleteAmount = (parseFloat(completeResult.complete_balance) || 0) +
                              (parseFloat(completeResult.complete_online_balance) || 0) +
                              (parseFloat(completeResult.complete_offline_balance) || 0);

    // 计算可退款金额
    let refundAmount = refund.aftersales.refund_amount;
    if (order?.shipping_status === 0) { // 未发货状态
      refundAmount += order.shipping_fee;
    }

    // 计算线上剩余可退金额
    let effectiveOnlineBalance = order?.online_paid_amount - (parseFloat(completeResult.complete_online_balance) || 0);
    if (refundAmount > 0) {
      effectiveOnlineBalance = Math.min(effectiveOnlineBalance, refundAmount);
    }

    return {
      ...refund,
      effective_online_balance: Number(effectiveOnlineBalance.toFixed(2)),
      total_complete_amount: Number(totalCompleteAmount.toFixed(2)),
    };
  }

  // 审核退款申请
  async auditRefundApply(id: number, auditDto: RefundApplyAuditDto) {
    const refund = await this.getDetail(id);
    const order = await this.orderRepository.findOne({
      where: { order_id: refund.order_id }
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 计算可退款金额
    let refundAmount = refund.aftersales.refund_amount;
    if (order.shipping_status === 0) {
      refundAmount += order.shipping_fee;
    }

    if (refundAmount <= 0) {
      throw new Error('售后申请退款金额为0,无法退款');
    }

    if (refund.refund_status !== RefundStatus.WAIT) {
      throw new Error('申请状态值错误');
    }

    // 验证退款金额
    if (auditDto.online_balance > refund.effective_online_balance) {
      throw new Error('填写的线上金额不能超过可退的在线支付金额');
    }

    if (auditDto.refund_balance > refundAmount) {
      throw new Error('填写的余额不能超过可退款总金额');
    }

    if (auditDto.offline_balance > refundAmount) {
      throw new Error('填写的线下金额不能超过可退款总金额');
    }

    if (auditDto.refund_status === RefundStatus.PROCESSED &&
        (auditDto.online_balance + auditDto.refund_balance + auditDto.offline_balance) === 0) {
      throw new Error('退款总金额不能为0');
    }

    // 开始事务处理
    await this.refundApplyRepository.manager.transaction(async manager => {
      let onlineBalance = 0;
      let refundBalance = 0;
      let offlineBalance = 0;

      if (auditDto.refund_status === RefundStatus.PROCESSED) {
        // 线上退款
        if (auditDto.online_balance > 0) {
          await manager.save(RefundLog, {
            order_id: refund.order_id,
            refund_apply_id: refund.refund_id,
            refund_type: RefundType.ONLINE,
            refund_amount: auditDto.online_balance,
            user_id: refund.user_id,
          });
          refund.is_online = 1;
          refund.online_balance = auditDto.online_balance;
          onlineBalance = auditDto.online_balance;
        }

        // 余额退款
        if (auditDto.refund_balance > 0) {
          await manager.save(RefundLog, {
            order_id: refund.order_id,
            refund_apply_id: refund.refund_id,
            refund_type: RefundType.BALANCE,
            refund_amount: auditDto.refund_balance,
            user_id: refund.user_id,
          });

          // 增加用户余额
          const user = await this.userRepository.findOne({
            where: { user_id: refund.user_id }
          });
          if (user) {
            user.balance += auditDto.refund_balance;
            await manager.save(user);
          }

          refund.is_receive = 2;
          refund.refund_balance = auditDto.refund_balance;
          refundBalance = auditDto.refund_balance;
        }

        // 线下退款
        if (auditDto.offline_balance > 0) {
          await manager.save(RefundLog, {
            order_id: refund.order_id,
            refund_apply_id: refund.refund_id,
            refund_type: RefundType.OFFLINE,
            refund_amount: auditDto.offline_balance,
            user_id: refund.user_id,
          });
          refund.is_offline = 1;
          refund.offline_balance = auditDto.offline_balance;
          offlineBalance = auditDto.offline_balance;
        }
      }

      // 退回库存
      await this.refundStock(refund.items, manager);

      // 更新退款状态
      refund.refund_status = auditDto.refund_status;
      refund.refund_note = auditDto.refund_note;
      refund.payment_voucher = auditDto.payment_voucher;

      // 检查是否退款成功
      if (this.checkRefundSuccess(refund)) {
        refund.refund_status = RefundStatus.PROCESSED;
        // 发送短信通知
        await this.sendSms(order.user_id, order.order_sn);
      }

      await manager.save(refund);
    });

    return true;
  }

  // 退回库存
  private async refundStock(items: any[], manager: any) {
    for (const item of items) {
      if (item.sku_id > 0) {
        const sku = await manager.findOne(ProductSku, { where: { sku_id: item.sku_id } });
        if (sku) {
          sku.stock += item.number;
          await manager.save(sku);
        }
      } else {
        const product = await manager.findOne(Product, { where: { product_id: item.product_id } });
        if (product) {
          product.stock += item.number;
          await manager.save(product);
        }
      }

      // 减少销量
      const product = await manager.findOne(Product, { where: { product_id: item.product_id } });
      if (product) {
        product.sales -= item.number;
        await manager.save(product);
      }

      // 秒杀品处理
      const seckill = await manager.findOne(Seckill, {
        where: { product_id: item.product_id, sku_id: item.sku_id }
      });
      if (seckill) {
        seckill.sales -= item.number;
        seckill.stock += item.number;
        await manager.save(seckill);
      }
    }
  }

  // 检查退款是否成功
  private checkRefundSuccess(refund: RefundApply) {
    return refund.is_online === 1 || refund.is_receive === 2 || refund.is_offline === 1;
  }

  // 发送短信
  private async sendSms(userId: number, orderSn: string) {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    if (user && user.mobile) {
      // 这里集成短信服务
      console.log(`发送退款成功短信给 ${user.mobile}，订单号：${orderSn}`);
    }
  }

  // 线下确认已退款
  async offlineAudit(auditDto: RefundApplyOfflineAuditDto) {
    const refund = await this.getDetail(auditDto.refund_id);

    if (!this.canAuditOffline(refund)) {
      throw new Error('该状态下不能确认线下已退款');
    }

    refund.is_offline = 2; // 线下已确认

    if (this.checkRefundSuccess(refund)) {
      refund.refund_status = RefundStatus.PROCESSED;
      // 扣减成长值逻辑
    }

    const order = await this.orderRepository.findOne({
      where: { order_id: refund.order_id }
    });

    if (order) {
      await this.sendSms(order.user_id, order.order_sn);
    }

    await this.refundApplyRepository.save(refund);
    return true;
  }

  // 判断是否可以线下确认
  private canAuditOffline(refund: RefundApply) {
    return refund.is_offline === 1 && refund.refund_status === RefundStatus.WAIT;
  }

  // 获取退款金额统计
  async getRefundTotal(dateRange: string[], shopId: number = 0) {
    const query = this.refundApplyRepository.createQueryBuilder('refund')
      .select('SUM(refund.online_balance + refund.offline_balance + refund.refund_balance)', 'refund_amount');

    if (shopId > 0) {
      query.andWhere('refund.shop_id = :shopId', { shopId });
    }

    query.andWhere('refund.refund_status = :status', { status: RefundStatus.PROCESSED });

    if (dateRange && dateRange.length === 2) {
      query.andWhere('refund.add_time BETWEEN :startDate AND :endDate', {
        startDate: new Date(dateRange[0]),
        endDate: new Date(dateRange[1]),
      });
    }

    const result = await query.getRawOne();
    return Number(result.refund_amount || 0).toFixed(2);
  }

  // 获取退款列表统计
  async getRefundList(dateRange: string[], shopId: number = 0) {
    const query = this.refundApplyRepository.createQueryBuilder('refund')
      .select([
        'SUM(refund.online_balance + refund.offline_balance + refund.refund_balance)', 'refund_amount',
        'MIN(refund.add_time)', 'add_time'
      ]);

    if (shopId > 0) {
      query.andWhere('refund.shop_id = :shopId', { shopId });
    }

    query.andWhere('refund.refund_status = :status', { status: RefundStatus.PROCESSED });

    if (dateRange && dateRange.length === 2) {
      query.andWhere('refund.add_time BETWEEN :startDate AND :endDate', {
        startDate: new Date(dateRange[0]),
        endDate: new Date(dateRange[1]),
      });
    }

    query.groupBy('DATE(refund.add_time)');

    return await query.getRawMany();
  }

  // 申请退款
  async applyRefund(applyData: any) {
    const refundApply = this.refundApplyRepository.create({
      refund_type: applyData.refund_type,
      order_id: applyData.order_id,
      user_id: applyData.user_id,
      aftersales_id: applyData.aftersales_id,
      shop_id: applyData.shop_id,
    });

    return await this.refundApplyRepository.save(refundApply);
  }
}