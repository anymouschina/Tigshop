// @ts-nocheck
import { Module } from "@nestjs/common";
import { PromotionController } from "./promotion.controller";
import { CouponController } from "./coupon.controller";
import { SeckillController } from "./seckill.controller";
import { GrouponController } from "./groupon.controller";
import { BargainController } from "./bargain.controller";
import { PointsExchangeController } from "./points-exchange.controller";
import { SignInController } from "./sign-in.controller";
import { PromotionService } from "./promotion.service";
import { CouponService } from "./coupon.service";
import { SeckillService } from "./seckill.service";
import { GrouponService } from "./groupon.service";
import { BargainService } from "./bargain.service";
import { PointsExchangeService } from "./points-exchange.service";
import { SignInService } from "./sign-in.service";

import { ProductTeamModule } from "./product-team/productTeam.module";
import { RechargeSettingModule } from "./recharge-setting/rechargeSetting.module";
import { TimeDiscountModule } from "./time-discount/timeDiscount.module";
import { WechatLiveModule } from "./wechat-live/wechatLive.module";
import { ProductPromotionService } from "./product-promotion/product-promotion.service";
import { AdminProductPromotionCompatController } from "./product-promotion/admin-product-promotion-compat.controller";
import { AdminCouponCompatController } from "./admin-coupon-compat.controller";
import { PanelModule } from "../panel/panel.module";
import { AdminPointsExchangeCompatController } from "./admin-points-exchange-compat.controller";
import { AdminPromotionCompatController } from "./admin-promotion-compat.controller";
import { AdminSeckillCompatController } from "./admin-seckill-compat.controller";
import { AdminTimeDiscountCompatController } from "./admin-time-discount-compat.controller";
import { ProductGiftService } from "./product-gift/product-gift.service";
import { AdminProductTeamCompatController } from "./admin-product-team-compat.controller";
import { AdminProductGiftCompatController } from "./admin-product-gift-compat.controller";
import { AdminRechargeSettingCompatController } from "./admin-recharge-setting-compat.controller";
import { AdminWechatLiveCompatController } from "./admin-wechat-live-compat.controller";
import { AdminSignInCompatController } from "./admin-sign-in-compat.controller";
import { AdminSignInSettingCompatController } from "./admin-sign-in-setting-compat.controller";
import { UserSignApiCompatController } from "./user-sign.api-compat.controller";
import { UserPointsLogModule } from "../user/user-points-log/user-points-log.module";

@Module({
  imports: [
    PanelModule,
    ProductTeamModule,
    RechargeSettingModule,
    TimeDiscountModule,
    WechatLiveModule,
    UserPointsLogModule,
  ],
  controllers: [
    PromotionController,
    CouponController,
    SeckillController,
    GrouponController,
    BargainController,
    PointsExchangeController,
    SignInController,
    AdminProductPromotionCompatController,
    AdminCouponCompatController,
    AdminPointsExchangeCompatController,
    AdminPromotionCompatController,
    AdminSeckillCompatController,
    AdminTimeDiscountCompatController,
    AdminProductTeamCompatController,
    AdminProductGiftCompatController,
    AdminRechargeSettingCompatController,
    AdminWechatLiveCompatController,
    AdminSignInCompatController,
    AdminSignInSettingCompatController,
    UserSignApiCompatController,
  ],
  providers: [
    PromotionService,
    CouponService,
    SeckillService,
    GrouponService,
    BargainService,
    PointsExchangeService,
    SignInService,
    ProductPromotionService,
    ProductGiftService,
  ],
  exports: [
    PromotionService,
    CouponService,
    SeckillService,
    GrouponService,
    BargainService,
    PointsExchangeService,
    SignInService,
    ProductTeamModule,
    RechargeSettingModule,
    TimeDiscountModule,
    WechatLiveModule,
  ],
})
export class PromotionModule {}
