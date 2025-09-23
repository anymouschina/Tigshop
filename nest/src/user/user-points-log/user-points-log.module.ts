// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserPointsLogService } from "./user-points-log.service";
import { UserPointsLogController } from "./user-points-log.controller";

@Module({
  controllers: [UserPointsLogController],
  providers: [UserPointsLogService],
  exports: [UserPointsLogService],
})
export class UserPointsLogModule {}
