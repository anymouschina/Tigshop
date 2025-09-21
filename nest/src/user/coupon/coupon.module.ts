import { Module } from "@nestjs/common";
import { UserCouponService } from "./coupon.service";
import { UserCouponController } from "./coupon.controller";

@Module({
  imports: [],
  controllers: [UserCouponController],
  providers: [UserCouponService],
  exports: [UserCouponService],
})
export class UserCouponModule {}
