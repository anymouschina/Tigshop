// @ts-nocheck
import { Module } from "@nestjs/common";
import { ToolRegionController } from "./tool-region.controller";
import { ToolRegionService } from "./tool-region.service";

@Module({
  imports: [],
  controllers: [ToolRegionController],
  providers: [ToolRegionService],
  exports: [ToolRegionService],
})
export class ToolRegionModule {}
