// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserHistoryService } from "./history.service";
import { UserHistoryController } from "./history.controller";

@Module({
  imports: [],
  controllers: [UserHistoryController],
  providers: [UserHistoryService],
  exports: [UserHistoryService],
})
export class UserHistoryModule {}
