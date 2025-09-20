// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserOrderController } from "./user-order.controller";
import { UserOrderService } from "./user-order.service";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [UserOrderController],
  providers: [UserOrderService, PrismaService],
  exports: [UserOrderService],
})
export class UserOrderModule {}
