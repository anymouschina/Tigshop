// @ts-nocheck
import { Module } from "@nestjs/common";
import { OrderCheckController } from "./order-check.controller";
import { OrderCheckService } from "./order-check.service";


@Module({
  controllers: [OrderCheckController],
  providers: [OrderCheckService, ],
  exports: [OrderCheckService],
})
export class OrderCheckModule {}
