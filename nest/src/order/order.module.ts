import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CartService } from 'src/cart/cart.service';
import { DatabaseService } from 'src/database/database.service';
import { CouponService } from 'src/coupon/coupon.service';
import { ProductModule } from 'src/product/product.module';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService, CartService, DatabaseService, CouponService],
  imports: [ProductModule, UserModule],
  exports: [OrderService],
})
export class OrderModule {}
