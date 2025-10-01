// @ts-nocheck
import { Module } from "@nestjs/common";
import { OrderInvoiceModule } from "./order-invoice.module";
import { UserOrderInvoiceApiCompatController } from "./user-order-invoice.api-compat.controller";

@Module({
  imports: [OrderInvoiceModule],
  controllers: [UserOrderInvoiceApiCompatController],
})
export class UserOrderInvoiceModule {}
