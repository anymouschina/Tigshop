import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { ProductModule } from 'src/product/product.module';
import { UserModule } from 'src/user/user.module';
import { CartModule } from 'src/cart/cart.module';
import { DatabaseModule } from 'src/database/database.module';
import { CouponService } from 'src/coupon/coupon.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, CouponService],
  imports: [ProductModule, forwardRef(() => UserModule), CartModule, DatabaseModule],
  exports: [OrderService],
})
export class OrderModule {}
