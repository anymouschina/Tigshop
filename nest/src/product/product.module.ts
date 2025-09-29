// @ts-nocheck
import { Module } from "@nestjs/common";
import { ProductService } from "./product.service";
import { ProductDetailService } from "./product-detail.service";
import { ProductController } from "./product.controller";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";
import { BrandController } from "./brand.controller";
import { BrandService } from "./brand.service";
import { CommentModule } from "./comment/comment.module";
import { SkuModule } from "./sku/sku.module";
import { AdminApiProductController } from "./admin-product.controller";
import { AdminApiCategoryController } from "./admin-category.controller";
import { AdminApiBrandController } from "./admin-brand.controller";

@Module({
  imports: [CommentModule, SkuModule],
  controllers: [
    ProductController,
    CategoryController,
    BrandController,
    // adminapi compatibility controllers
    AdminApiProductController,
    AdminApiCategoryController,
    AdminApiBrandController,
  ],
  providers: [
    ProductService,
    ProductDetailService,
    CategoryService,
    BrandService,
  ],
  exports: [
    ProductService,
    ProductDetailService,
    CategoryService,
    BrandService,
  ],
})
export class ProductModule {}
