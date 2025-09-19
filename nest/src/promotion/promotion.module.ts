import { Module } from '@nestjs/common';
import { PromotionController } from './promotion.controller';
import { CouponController } from './coupon.controller';
import { SeckillController } from './seckill.controller';
import { GrouponController } from './groupon.controller';
import { BargainController } from './bargain.controller';
import { PointsExchangeController } from './points-exchange.controller';
import { SignInController } from './sign-in.controller';
import { PromotionService } from './promotion.service';
import { CouponService } from './coupon.service';
import { SeckillService } from './seckill.service';
import { GrouponService } from './groupon.service';
import { BargainService } from './bargain.service';
import { PointsExchangeService } from './points-exchange.service';
import { SignInService } from './sign-in.service';
import { PrismaService } from '../prisma.service';
import { ProductGiftModule } from './product-gift/product-gift.module';
import { ProductPromotionModule } from './product-promotion/product-promotion.module';

@Module({
  imports: [
    ProductGiftModule,
    ProductPromotionModule,
  ],
  controllers: [
    PromotionController,
    CouponController,
    SeckillController,
    GrouponController,
    BargainController,
    PointsExchangeController,
    SignInController,
  ],
  providers: [
    PromotionService,
    CouponService,
    SeckillService,
    GrouponService,
    BargainService,
    PointsExchangeService,
    SignInService,
    PrismaService,
  ],
  exports: [
    PromotionService,
    CouponService,
    SeckillService,
    GrouponService,
    BargainService,
    PointsExchangeService,
    SignInService,
    ProductGiftModule,
    ProductPromotionModule,
  ],
})
export class PromotionModule {}