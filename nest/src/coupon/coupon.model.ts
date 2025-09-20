// @ts-nocheck
import { Prisma } from '@prisma/client';

export class Coupon {
  couponName: string;
  couponType: number;
  couponCode: string;
  discountAmount?: number;
  discountRate?: number;
  minAmount?: number;
  startTime: string | Date;
  endTime: string | Date;
  totalNum: number;
  usedNum: number;
  isEnable: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  couponId: number;
}
