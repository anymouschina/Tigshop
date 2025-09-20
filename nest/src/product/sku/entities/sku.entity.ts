// @ts-nocheck
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("product_skus")
export class Sku {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "product_id" })
  productId: number;

  @Column({ name: "sku_code" })
  skuCode: string;

  @Column({ name: "price", type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ name: "stock" })
  stock: number;

  @Column({ name: "specs", type: "json" })
  specs: any;

  @Column({ name: "image", nullable: true })
  image: string;

  @Column({ name: "status", default: "active" })
  status: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}