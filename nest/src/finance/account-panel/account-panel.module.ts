// @ts-nocheck
import { Module } from "@nestjs/common";
import { AccountPanelService } from "./account-panel.service";
import { AccountPanelController } from "./account-panel.controller";
import { PrismaService } from "../../../database/prisma.service";

@Module({
  controllers: [AccountPanelController],
  providers: [AccountPanelService, PrismaService],
  exports: [AccountPanelService],
})
export class AccountPanelModule {}
