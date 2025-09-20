// @ts-nocheck
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "product_name" })
  productName: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "price", type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ name: "category_id" })
  categoryId: number;

  @Column({ name: "status", default: "active" })
  status: string;

  @Column({ name: "is_using", default: 1 })
  isUsing: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}