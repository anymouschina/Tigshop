// @ts-nocheck
import { Module } from "@nestjs/common";
import { OrderCheckModule } from "./order/order-check.module";
import { OrderPayModule } from "./order/order-pay.module";
import { UserOrderModule } from "./user/user-order.module";
import { UserLoginModule } from "./user/user-login.module";
import { UserAddressModule } from "./user/user-address.module";
import { UserCollectModule } from "./user/user-collect.module";
import { UserRechargeOrderModule } from "./user/user-recharge-order.module";
import { UserWithdrawApplyModule } from "./user/user-withdraw-apply.module";
import { HomeModule } from "./home/home.module";
import { CategoryModule } from "./category/category.module";
import { UserRegistModule } from "./user/user-regist.module";
import { UserOauthModule } from "./user/user-oauth.module";
import { UserModule as UserModuleInfo } from "./user/user.module";
import { UserAccountModule } from "./user/user-account.module";
import { UserSignModule } from "./user/user-sign.module";
import { UserCommentModule } from "./user/user-comment.module";
import { UserMessageModule } from "./user/user-message.module";
import { UserCouponModule } from "./user/user-coupon.module";
import { UserPointsLogModule } from "../user/user-points-log/user-points-log.module";
import { UserCompanyModule } from "../user/user-company/user-company.module";
import { UserAftersalesModule } from "./user/user-aftersales.module";

@Module({
  imports: [
    OrderCheckModule,
    OrderPayModule,
    UserOrderModule,
    UserLoginModule,
    UserAddressModule,
    UserCollectModule,
    UserRechargeOrderModule,
    UserWithdrawApplyModule,
    HomeModule,
    CategoryModule,
    UserRegistModule,
    UserOauthModule,
    UserModuleInfo,
    UserAccountModule,
    UserSignModule,
    UserCommentModule,
    UserMessageModule,
    UserCouponModule,
    UserPointsLogModule,
    UserCompanyModule,
    UserAftersalesModule,
  ],
  exports: [
    OrderCheckModule,
    OrderPayModule,
    UserOrderModule,
    UserLoginModule,
    UserAddressModule,
    UserCollectModule,
    UserRechargeOrderModule,
    UserWithdrawApplyModule,
    HomeModule,
    CategoryModule,
    UserRegistModule,
    UserOauthModule,
    UserModuleInfo,
    UserAccountModule,
    UserSignModule,
    UserCommentModule,
    UserMessageModule,
    UserCouponModule,
    UserPointsLogModule,
    UserCompanyModule,
    UserAftersalesModule,
  ],
})
export class ApiModule {}
