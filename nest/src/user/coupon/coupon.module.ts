import { Module } from "@nestjs/common";
import { UserCouponService } from "./coupon.service";
import { UserCouponController } from "./coupon.controller";
import { UserCouponApiCompatController } from "./coupon.api-compat.controller";

@Module({
  imports: [],
  controllers: [UserCouponController, UserCouponApiCompatController],
  providers: [UserCouponService],
  exports: [UserCouponService],
})
export class UserCouponModule {}
