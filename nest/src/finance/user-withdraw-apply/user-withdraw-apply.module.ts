// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserWithdrawApplyService } from "./user-withdraw-apply.service";
import { UserWithdrawApplyController } from "./user-withdraw-apply.controller";
import { UserWithdrawApplyApiCompatController } from "./user-withdraw-apply.api-compat.controller";

@Module({
  imports: [],
  controllers: [UserWithdrawApplyController, UserWithdrawApplyApiCompatController],
  providers: [UserWithdrawApplyService],
  exports: [UserWithdrawApplyService],
})
export class UserWithdrawApplyModule {}
