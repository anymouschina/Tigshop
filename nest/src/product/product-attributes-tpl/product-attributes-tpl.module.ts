// @ts-nocheck
import { Module } from "@nestjs/common";
import { ProductAttributesTplController } from "./product-attributes-tpl.controller";
import { ProductAttributesTplService } from "./product-attributes-tpl.service";
import { PrismaModule } from "../../common/services/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ProductAttributesTplController],
  providers: [ProductAttributesTplService],
  exports: [ProductAttributesTplService],
})
export class ProductAttributesTplModule {}
