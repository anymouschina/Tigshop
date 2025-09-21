// @ts-nocheck
import { Module } from "@nestjs/common";
import { RechargeSettingService } from "./rechargeSetting.service";
import { RechargeSettingController } from "./rechargeSetting.controller";

@Module({
  imports: [],
  controllers: [RechargeSettingController],
  providers: [RechargeSettingService],
  exports: [RechargeSettingService],
})
export class RechargeSettingModule {}
