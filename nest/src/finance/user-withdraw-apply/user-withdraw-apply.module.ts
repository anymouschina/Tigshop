// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserWithdrawApplyService } from "./user-withdraw-apply.service";
import { UserWithdrawApplyController } from "./user-withdraw-apply.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [UserWithdrawApplyController],
  providers: [UserWithdrawApplyService],
  exports: [UserWithdrawApplyService],
})
export class UserWithdrawApplyModule {}
