// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserPointsLogService } from "./user-points-log.service";
import { UserPointsLogController } from "./user-points-log.controller";
import { UserPointsLogApiCompatController } from "./user-points-log.api-compat.controller";

@Module({
  controllers: [UserPointsLogController, UserPointsLogApiCompatController],
  providers: [UserPointsLogService],
  exports: [UserPointsLogService],
})
export class UserPointsLogModule {}
