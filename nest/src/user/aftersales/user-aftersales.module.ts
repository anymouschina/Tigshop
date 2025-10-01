// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserAftersalesApiCompatController } from "./user-aftersales.api-compat.controller";
import { RefundApplyModule } from "../../finance/refund-apply/refund-apply.module";

@Module({
  imports: [RefundApplyModule],
  controllers: [UserAftersalesApiCompatController],
  providers: [],
})
export class UserAftersalesModule {}
