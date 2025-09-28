import { Module } from "@nestjs/common";
import { RefundController } from "./refund.controller";
import { RefundService } from "./refund.service";
import { RefundApplyModule } from "../refund-apply/refund-apply.module";
import { RefundLogModule } from "../refund-log/refund-log.module";
import { PaymentModule } from "../../payment/payment.module";
import { OrderModule } from "../../order/order.module";

@Module({
  imports: [RefundApplyModule, RefundLogModule, PaymentModule, OrderModule],
  controllers: [RefundController],
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
