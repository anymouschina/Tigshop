import { Module } from '@nestjs/common';
import { UserCouponService } from './coupon.service';
import { UserCouponController } from './coupon.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UserCouponController],
  providers: [UserCouponService],
  exports: [UserCouponService],
})
export class UserCouponModule {}
