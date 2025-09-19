import { Module } from '@nestjs/common';
import { PromotionController } from './promotion.controller';
import { CouponController } from './coupon.controller';
import { PromotionService } from './promotion.service';
import { CouponService } from './coupon.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PromotionController, CouponController],
  providers: [PromotionService, CouponService, PrismaService],
  exports: [PromotionService, CouponService],
})
export class PromotionModule {}