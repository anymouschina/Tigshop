// @ts-nocheck
import { Module } from "@nestjs/common";
import { AccountPanelService } from "./account-panel.service";
import { AccountPanelController } from "./account-panel.controller";


@Module({
  controllers: [AccountPanelController],
  providers: [AccountPanelService, ],
  exports: [AccountPanelService],
})
export class AccountPanelModule {}
