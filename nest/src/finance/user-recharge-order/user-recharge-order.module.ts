// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserRechargeOrderService } from "./user-recharge-order.service";
import { UserRechargeOrderController } from "./user-recharge-order.controller";
import { UserRechargeOrderApiCompatController } from "./user-recharge-order.api-compat.controller";
import { RechargeSettingModule } from "src/promotion/recharge-setting/rechargeSetting.module";

@Module({
  imports: [RechargeSettingModule],
  controllers: [UserRechargeOrderController, UserRechargeOrderApiCompatController],
  providers: [UserRechargeOrderService],
  exports: [UserRechargeOrderService],
})
export class UserRechargeOrderModule {}
