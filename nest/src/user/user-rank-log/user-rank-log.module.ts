// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserRankLogController } from "./user-rank-log.controller";
import { UserRankLogService } from "./user-rank-log.service";

@Module({
  imports: [],
  controllers: [UserRankLogController],
  providers: [UserRankLogService],
  exports: [UserRankLogService],
})
export class UserRankLogModule {}
