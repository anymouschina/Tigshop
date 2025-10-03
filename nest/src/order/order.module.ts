// @ts-nocheck
import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderCheckController } from "./order-check.controller";
import { OrderService } from "./order.service";
import { OrderCheckService } from "./order-check.service";
import { PayController } from "./pay.controller";
import { PayService } from "./pay.service";
import { AftersalesController } from "./aftersales.controller";
import { AftersalesService } from "./aftersales.service";
import { CartModule } from "../cart/cart.module";
import { AdminOrderCompatController } from "./admin-order-compat.controller";
import { AdminOrderCompatService } from "./admin-order-compat.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { PanelModule } from "src/panel/panel.module";

@Module({
  imports: [CartModule, PrismaModule, PanelModule],
  controllers: [OrderController, OrderCheckController, AftersalesController, AdminOrderCompatController, PayController],
  providers: [OrderService, OrderCheckService, AftersalesService, AdminOrderCompatService, PayService],
  exports: [OrderService, OrderCheckService, AftersalesService, PayService],
})
export class OrderModule {}
