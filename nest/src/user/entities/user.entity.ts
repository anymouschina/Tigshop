// @ts-nocheck
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ name: "user_id" })
  userId: number;

  @Column({ name: "username" })
  username: string;

  @Column({ name: "email" })
  email: string;

  @Column({ name: "mobile" })
  mobile: string;

  @Column({ name: "password" })
  password: string;

  @Column({ name: "avatar", nullable: true })
  avatar: string;

  @Column({ name: "status", default: "active" })
  status: string;

  @Column({ name: "is_using", default: 1 })
  isUsing: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}