// @ts-nocheck
import { Module } from "@nestjs/common";
import { PanelController } from "./panel.controller";
import { PanelService } from "./panel.service";
import { AuthorityService } from "../authority/authority.service";
import { StatisticsModule } from "../statistics/statistics.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, StatisticsModule],
  controllers: [PanelController],
  providers: [PanelService, AuthorityService],
  exports: [PanelService],
})
export class PanelModule {}
