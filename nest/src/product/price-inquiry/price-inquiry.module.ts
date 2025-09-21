// @ts-nocheck
import { Module } from "@nestjs/common";
import { PriceInquiryController } from "./price-inquiry.controller";
import { PriceInquiryService } from "./price-inquiry.service";


@Module({
  imports: [],
  controllers: [PriceInquiryController],
  providers: [PriceInquiryService],
  exports: [PriceInquiryService],
})
export class PriceInquiryModule {}
