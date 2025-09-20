import { Module } from '@nestjs/common';
import { UserCouponController } from './user-coupon.controller';
import { UserCouponService } from './user-coupon.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UserCouponController],
  providers: [UserCouponService, PrismaService],
  exports: [UserCouponService],
})
export class UserCouponModule {}