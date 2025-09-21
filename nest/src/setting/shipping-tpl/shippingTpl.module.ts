// @ts-nocheck
import { Module } from "@nestjs/common";
import { ShippingTplService } from "./shippingTpl.service";
import { ShippingTplController } from "./shippingTpl.controller";

@Module({
  imports: [],
  controllers: [ShippingTplController],
  providers: [ShippingTplService],
  exports: [ShippingTplService],
})
export class ShippingTplModule {}
