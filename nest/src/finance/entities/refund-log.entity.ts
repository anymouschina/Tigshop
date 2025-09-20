// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { RefundApply } from "./refund-apply.entity";

export enum RefundLogType {
  ONLINE = 1, // 线上退款
  BALANCE = 2, // 余额退款
  OFFLINE = 3, // 线下退款
}

@Entity("refund_log")
export class RefundLog {
  @PrimaryGeneratedColumn({ name: "log_id" })
  log_id: number;

  @Column({ name: "order_id", type: "int" })
  order_id: number;

  @Column({ name: "refund_apply_id", type: "int" })
  refund_apply_id: number;

  @Column({ name: "refund_type", type: "tinyint" })
  refund_type: RefundLogType;

  @Column({ name: "refund_amount", type: "decimal", precision: 10, scale: 2 })
  refund_amount: number;

  @Column({ name: "user_id", type: "int" })
  user_id: number;

  @Column({ name: "admin_id", type: "int", nullable: true })
  admin_id: number;

  @Column({ name: "refund_note", type: "text", nullable: true })
  refund_note: string;

  @CreateDateColumn({ name: "add_time" })
  add_time: Date;

  // 关联关系
  @ManyToOne(() => RefundApply, (refundApply) => refundApply.log)
  @JoinColumn({ name: "refund_apply_id" })
  refund_apply: RefundApply;

  getRefundTypeName(): string {
    const typeMap = {
      [RefundLogType.ONLINE]: "线上退款",
      [RefundLogType.BALANCE]: "余额退款",
      [RefundLogType.OFFLINE]: "线下退款",
    };
    return typeMap[this.refund_type] || "";
  }
}
