import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderCheckController } from './order-check.controller';
import { OrderService } from './order.service';
import { DatabaseModule } from '../database/database.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [DatabaseModule, CartModule],
  controllers: [OrderController, OrderCheckController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}