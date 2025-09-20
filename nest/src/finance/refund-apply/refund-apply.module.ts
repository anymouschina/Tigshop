// @ts-nocheck
import { Module } from "@nestjs/common";
import { RefundApplyController } from "./refund-apply.controller";
import { RefundApplyService } from "./refund-apply.service";

@Module({
  controllers: [RefundApplyController],
  providers: [RefundApplyService],
  exports: [RefundApplyService],
})
export class RefundApplyModule {}
