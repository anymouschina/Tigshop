// @ts-nocheck
import { Module } from "@nestjs/common";
import { PanelController } from "./panel.controller";
import { PanelService } from "./panel.service";
import { AuthorityService } from "../authority/authority.service";


@Module({
  controllers: [PanelController],
  providers: [PanelService, AuthorityService, ],
  exports: [PanelService],
})
export class PanelModule {}
