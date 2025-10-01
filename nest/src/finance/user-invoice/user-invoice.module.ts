// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserInvoiceService } from "./user-invoice.service";
import { UserInvoiceController } from "./user-invoice.controller";
import { UserInvoiceApiCompatController } from "./user-invoice.api-compat.controller";

@Module({
  imports: [],
  controllers: [UserInvoiceController, UserInvoiceApiCompatController],
  providers: [UserInvoiceService],
  exports: [UserInvoiceService],
})
export class UserInvoiceModule {}
