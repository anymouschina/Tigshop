// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserRechargeOrderService } from "./user-recharge-order.service";
import { UserRechargeOrderController } from "./user-recharge-order.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [UserRechargeOrderController],
  providers: [UserRechargeOrderService],
  exports: [UserRechargeOrderService],
})
export class UserRechargeOrderModule {}
