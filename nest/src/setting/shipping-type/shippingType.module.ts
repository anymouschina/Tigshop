// @ts-nocheck
import { Module } from "@nestjs/common";
import { ShippingTypeService } from "./shippingType.service";
import { ShippingTypeController } from "./shippingType.controller";

@Module({
  imports: [],
  controllers: [ShippingTypeController],
  providers: [ShippingTypeService],
  exports: [ShippingTypeService],
})
export class ShippingTypeModule {}
