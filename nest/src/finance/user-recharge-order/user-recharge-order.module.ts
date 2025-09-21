// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserRechargeOrderService } from "./user-recharge-order.service";
import { UserRechargeOrderController } from "./user-recharge-order.controller";

@Module({
  imports: [],
  controllers: [UserRechargeOrderController],
  providers: [UserRechargeOrderService],
  exports: [UserRechargeOrderService],
})
export class UserRechargeOrderModule {}
