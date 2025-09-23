// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserBalanceLogController } from "./user-balance-log.controller";
import { UserBalanceLogService } from "./user-balance-log.service";

@Module({
  controllers: [UserBalanceLogController],
  providers: [UserBalanceLogService],
  exports: [UserBalanceLogService],
})
export class UserBalanceLogModule {}
