// @ts-nocheck
import { Module } from "@nestjs/common";
import { ECardGroupController } from "./ecard-group.controller";
import { ECardGroupService } from "./ecard-group.service";


@Module({
  imports: [],
  controllers: [ECardGroupController],
  providers: [ECardGroupService],
  exports: [ECardGroupService],
})
export class ECardGroupModule {}
