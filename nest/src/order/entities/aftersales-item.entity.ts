// @ts-nocheck
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Aftersales } from "./aftersales.entity";

@Entity("aftersales_items")
export class AftersalesItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "aftersales_id" })
  aftersalesId: number;

  @Column({ name: "product_id" })
  productId: number;

  @Column({ name: "quantity" })
  quantity: number;

  @Column({ name: "amount", type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ name: "reason" })
  reason: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Aftersales, aftersales => aftersales.items)
  @JoinColumn({ name: "aftersales_id" })
  aftersales: Aftersales;
}