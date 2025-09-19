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

@Module({
  controllers: [PromotionController, CouponController, SeckillController, GrouponController, BargainController, PointsExchangeController, SignInController],
  providers: [PromotionService, CouponService, SeckillService, GrouponService, BargainService, PointsExchangeService, SignInService, PrismaService],
  exports: [PromotionService, CouponService, SeckillService, GrouponService, BargainService, PointsExchangeService, SignInService],
})
export class PromotionModule {}