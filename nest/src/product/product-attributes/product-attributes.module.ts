// @ts-nocheck
import { Module } from "@nestjs/common";
import { ProductAttributesController } from "./product-attributes.controller";
import { ProductAttributesService } from "./product-attributes.service";

@Module({
  imports: [],
  controllers: [ProductAttributesController],
  providers: [ProductAttributesService],
  exports: [ProductAttributesService],
})
export class ProductAttributesModule {}
