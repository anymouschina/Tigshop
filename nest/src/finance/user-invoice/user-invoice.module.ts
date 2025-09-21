// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserInvoiceService } from "./user-invoice.service";
import { UserInvoiceController } from "./user-invoice.controller";

@Module({
  imports: [],
  controllers: [UserInvoiceController],
  providers: [UserInvoiceService],
  exports: [UserInvoiceService],
})
export class UserInvoiceModule {}
