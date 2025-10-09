// @ts-nocheck
import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { PaymentCallbackController } from "./payment-callback.controller";
import { OrderModule } from "src/order/order.module";

@Module({
  imports: [OrderModule],
  controllers: [PaymentController, PaymentCallbackController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
