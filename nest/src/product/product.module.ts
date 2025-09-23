// @ts-nocheck
import { Module } from "@nestjs/common";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";
import { BrandController } from "./brand.controller";
import { BrandService } from "./brand.service";
import { CommentModule } from "./comment/comment.module";
import { SkuModule } from "./sku/sku.module";

@Module({
  imports: [CommentModule, SkuModule],
  controllers: [ProductController, CategoryController, BrandController],
  providers: [ProductService, CategoryService, BrandService],
  exports: [ProductService, CategoryService, BrandService],
})
export class ProductModule {}
