// @ts-nocheck
import { Module } from "@nestjs/common";
import { RegionController } from "./region.controller";
import { RegionService } from "./region.service";
import { AdminRegionCompatController } from "./admin-region-compat.controller";

@Module({
  controllers: [RegionController, AdminRegionCompatController],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
