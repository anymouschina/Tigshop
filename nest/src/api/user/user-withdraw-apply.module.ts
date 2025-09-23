// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserWithdrawApplyController } from "./user-withdraw-apply.controller";
import { UserWithdrawApplyService } from "./user-withdraw-apply.service";

@Module({
  controllers: [UserWithdrawApplyController],
  providers: [UserWithdrawApplyService],
  exports: [UserWithdrawApplyService],
})
export class UserWithdrawApplyModule {}
