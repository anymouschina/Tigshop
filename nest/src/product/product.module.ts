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
import { AdminApiProductGroupController } from "./admin-product-group.controller";
import { ProductGroupCompatService } from "./product-group-compat.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { AdminApiProductCommentController } from "./comment/admin-comment.controller";
import { AdminCommentCompatService } from "./comment/admin-comment-compat.service";
import { AdminApiProductShippingCompatController } from "./admin-product-shipping-compat.controller";
import { ShippingTplService } from "src/setting/shipping-tpl/shippingTpl.service";
import { AdminApiProductBatchCompatController } from "./admin-product-batch-compat.controller";

@Module({
  imports: [CommentModule, SkuModule, PrismaModule],
  controllers: [
    ProductController,
    CategoryController,
    BrandController,
    // adminapi compatibility controllers
    AdminApiProductController,
    AdminApiCategoryController,
    AdminApiBrandController,
    AdminApiProductGroupController,
    AdminApiProductCommentController,
    AdminApiProductShippingCompatController,
    AdminApiProductBatchCompatController,
  ],
  providers: [
    ProductService,
    ProductDetailService,
    CategoryService,
    BrandService,
    ProductGroupCompatService,
    AdminCommentCompatService,
    ShippingTplService,
  ],
  exports: [
    ProductService,
    ProductDetailService,
    CategoryService,
    BrandService,
  ],
})
export class ProductModule {}
