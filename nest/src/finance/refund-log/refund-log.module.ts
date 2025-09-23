// @ts-nocheck
import { Module } from "@nestjs/common";
import { RefundLogService } from "./refund-log.service";

@Module({
  providers: [RefundLogService],
  exports: [RefundLogService],
})
export class RefundLogModule {}
