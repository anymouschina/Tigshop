// @ts-nocheck
import { Module } from "@nestjs/common";
import { PaylogController } from "./paylog.controller";
import { PaylogService } from "./paylog.service";

@Module({
  controllers: [PaylogController],
  providers: [PaylogService],
  exports: [PaylogService],
})
export class PaylogModule {}
