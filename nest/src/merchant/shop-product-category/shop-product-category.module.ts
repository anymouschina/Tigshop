import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { ShopProductCategoryController } from "./shop-product-category.controller";
import { ShopProductCategoryService } from "./shop-product-category.service";

@Module({
  imports: [PrismaModule],
  controllers: [ShopProductCategoryController],
  providers: [ShopProductCategoryService],
  exports: [ShopProductCategoryService],
})
export class ShopProductCategoryModule {}
