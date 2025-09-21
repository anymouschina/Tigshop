// @ts-nocheck
import { Module } from "@nestjs/common";
import { OrderPayController } from "./order-pay.controller";
import { OrderPayService } from "./order-pay.service";


@Module({
  controllers: [OrderPayController],
  providers: [OrderPayService, ],
  exports: [OrderPayService],
})
export class OrderPayModule {}
