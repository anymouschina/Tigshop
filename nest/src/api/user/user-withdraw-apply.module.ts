// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserWithdrawApplyController } from "./user-withdraw-apply.controller";
import { UserWithdrawApplyService } from "./user-withdraw-apply.service";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [UserWithdrawApplyController],
  providers: [UserWithdrawApplyService, PrismaService],
  exports: [UserWithdrawApplyService],
})
export class UserWithdrawApplyModule {}
