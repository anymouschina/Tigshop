// @ts-nocheck
import { Module } from "@nestjs/common";
import { ProductAttributesTplController } from "./product-attributes-tpl.controller";
import { ProductAttributesTplService } from "./product-attributes-tpl.service";


@Module({
  imports: [],
  controllers: [ProductAttributesTplController],
  providers: [ProductAttributesTplService],
  exports: [ProductAttributesTplService],
})
export class ProductAttributesTplModule {}
