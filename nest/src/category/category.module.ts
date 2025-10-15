// @ts-nocheck
import { Module } from "@nestjs/common";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";
import { PrismaModule } from "../prisma/prisma.module";
import { ShopProductCategoryModule } from "src/merchant/shop-product-category/shop-product-category.module";

@Module({
  // Include shop product category module so public category endpoints can fallback/serve shop-specific trees.
  imports: [PrismaModule, ShopProductCategoryModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
