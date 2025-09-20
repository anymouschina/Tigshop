// @ts-nocheck
import { Module } from "@nestjs/common";
import { RechargeSettingService } from "./rechargeSetting.service";
import { RechargeSettingController } from "./rechargeSetting.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [RechargeSettingController],
  providers: [RechargeSettingService],
  exports: [RechargeSettingService],
})
export class RechargeSettingModule {}
