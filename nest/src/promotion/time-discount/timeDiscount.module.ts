// @ts-nocheck
import { Module } from "@nestjs/common";
import { TimeDiscountService } from "./timeDiscount.service";
import { TimeDiscountController } from "./timeDiscount.controller";

@Module({
  imports: [],
  controllers: [TimeDiscountController],
  providers: [TimeDiscountService],
  exports: [TimeDiscountService],
})
export class TimeDiscountModule {}
