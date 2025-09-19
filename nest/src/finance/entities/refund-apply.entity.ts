import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Aftersales } from '../../order/entities/aftersales.entity';
import { Order } from '../../order/entities/order.entity';
import { RefundLog } from './refund-log.entity';

export enum RefundType {
  ORDER = 1,
  PRODUCT = 2,
}

export enum RefundStatus {
  WAIT = 0,
  PROCESSING = 1,
  PROCESSED = 2,
  CANCEL = 3,
}

@Entity('refund_apply')
export class RefundApply {
  @PrimaryGeneratedColumn({ name: 'refund_id' })
  refund_id: number;

  @Column({ name: 'refund_type', type: 'tinyint', default: RefundType.ORDER })
  refund_type: RefundType;

  @Column({ name: 'refund_status', type: 'tinyint', default: RefundStatus.WAIT })
  refund_status: RefundStatus;

  @Column({ name: 'order_id', type: 'int' })
  order_id: number;

  @Column({ name: 'user_id', type: 'int' })
  user_id: number;

  @Column({ name: 'aftersales_id', type: 'int' })
  aftersales_id: number;

  @Column({ name: 'shop_id', type: 'int', default: 0 })
  shop_id: number;

  @Column({ name: 'is_online', type: 'tinyint', default: 0 })
  is_online: number; // 0:未处理 1:已提交 2:已成功

  @Column({ name: 'online_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  online_balance: number;

  @Column({ name: 'is_receive', type: 'tinyint', default: 0 })
  is_receive: number; // 0:未处理 1:已提交 2:已成功

  @Column({ name: 'refund_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refund_balance: number;

  @Column({ name: 'is_offline', type: 'tinyint', default: 0 })
  is_offline: number; // 0:未处理 1:已提交 2:已成功

  @Column({ name: 'offline_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  offline_balance: number;

  @Column({ name: 'refund_note', type: 'text', nullable: true })
  refund_note: string;

  @Column({ name: 'payment_voucher', type: 'text', nullable: true })
  payment_voucher: string;

  @Column({ name: 'paylog_refund_id', type: 'int', nullable: true })
  paylog_refund_id: number;

  @CreateDateColumn({ name: 'add_time' })
  add_time: Date;

  // 关联关系
  @ManyToOne(() => Aftersales, aftersales => aftersales.refund_applys)
  @JoinColumn({ name: 'aftersales_id' })
  aftersales: Aftersales;

  @ManyToOne(() => Order, order => order.refund_applys)
  @JoinColumn({ name: 'order_id' })
  order_info: Order;

  @OneToMany(() => RefundLog, refundLog => refundLog.refund_apply)
  log: RefundLog[];

  // 方法
  canAuditOffline(): boolean {
    return this.is_offline === 1;
  }

  setOfflineSuccess(): void {
    this.is_offline = 2;
  }

  setOnlineSuccess(): void {
    this.is_online = 2;
  }

  checkRefundSuccess(): boolean {
    return this.is_offline !== 1 && this.is_online !== 1 && this.is_receive !== 1;
  }

  setRefundSuccess(): void {
    this.refund_status = RefundStatus.PROCESSED;
  }

  getRefundStatusName(): string {
    const statusMap = {
      [RefundStatus.WAIT]: '待处理',
      [RefundStatus.PROCESSING]: '处理中',
      [RefundStatus.PROCESSED]: '已处理',
      [RefundStatus.CANCEL]: '已取消',
    };
    return statusMap[this.refund_status] || '';
  }

  getRefundTypeName(): string {
    const typeMap = {
      [RefundType.ORDER]: '订单',
      [RefundType.PRODUCT]: '商品',
    };
    return typeMap[this.refund_type] || '';
  }
}