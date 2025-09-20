// @ts-nocheck
import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderCheckController } from "./order-check.controller";
import { OrderService } from "./order.service";
import { OrderCheckService } from "./order-check.service";
import { AftersalesController } from "./aftersales.controller";
import { AftersalesService } from "./aftersales.service";
import { DatabaseModule } from "../database/database.module";
import { CartModule } from "../cart/cart.module";

@Module({
  imports: [DatabaseModule, CartModule],
  controllers: [OrderController, OrderCheckController, AftersalesController],
  providers: [OrderService, OrderCheckService, AftersalesService],
  exports: [OrderService, OrderCheckService, AftersalesService],
})
export class OrderModule {}
