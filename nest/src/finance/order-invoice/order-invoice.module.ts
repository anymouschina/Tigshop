// @ts-nocheck
import { Module } from "@nestjs/common";
import { OrderInvoiceService } from "./order-invoice.service";
import { OrderInvoiceController } from "./order-invoice.controller";


@Module({
  controllers: [OrderInvoiceController],
  providers: [OrderInvoiceService, ],
  exports: [OrderInvoiceService],
})
export class OrderInvoiceModule {}
