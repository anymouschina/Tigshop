// @ts-nocheck
import { Module } from "@nestjs/common";
import { RegionController } from "./region.controller";
import { RegionService } from "./region.service";
import { AdminRegionCompatController } from "./admin-region-compat.controller";
import { RegionApiController } from "../../sys/region.api.controller";

@Module({
  controllers: [
    RegionController,
    AdminRegionCompatController,
    RegionApiController,
  ],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
