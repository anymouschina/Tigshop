// @ts-nocheck
import { Module } from "@nestjs/common";
import { ToolRegionController } from "./tool-region.controller";
import { ToolRegionService } from "./tool-region.service";
import { PrismaModule } from "../../common/services/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ToolRegionController],
  providers: [ToolRegionService],
  exports: [ToolRegionService],
})
export class ToolRegionModule {}
