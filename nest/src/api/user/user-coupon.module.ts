// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserCouponController } from "./user-coupon.controller";
import { UserCouponService } from "./user-coupon.service";


@Module({
  controllers: [UserCouponController],
  providers: [UserCouponService, ],
  exports: [UserCouponService],
})
export class UserCouponModule {}
