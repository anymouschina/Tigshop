// @ts-nocheck
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("aftersales")
export class Aftersales {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "order_id" })
  orderId: number;

  @Column({ name: "user_id" })
  userId: number;

  @Column({ name: "reason" })
  reason: string;

  @Column({ name: "description" })
  description: string;

  @Column({ name: "status", default: "pending" })
  status: string;

  @Column({ name: "images", type: "json", nullable: true })
  images: string[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}