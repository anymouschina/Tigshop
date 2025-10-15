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
import { AdminApiProductInventoryLogCompatController } from "./admin-product-inventory-log-compat.controller";
import { AdminApiPriceInquiryCompatController } from "./admin-price-inquiry-compat.controller";
import { AdminApiProductAttributesTplCompatController } from "./admin-product-attributes-tpl-compat.controller";
import { AdminApiProductServicesCompatController } from "./admin-product-services-compat.controller";
import { AdminApiProductCreateCompatController } from "./admin-product-create-compat.controller";
import { ProductInventoryLogModule } from "./product-inventory-log/product-inventory-log.module";
import { PriceInquiryModule } from "./price-inquiry/price-inquiry.module";
import { ProductAttributesTplModule } from "./product-attributes-tpl/product-attributes-tpl.module";
import { PanelModule } from "src/panel/panel.module";
import { AdminProductBatchCompatService } from "./admin-product-batch-compat.service";
import { ProductServicesModule } from "./product-services/product-services.module";
import { ProductPricingService } from "./pricing/product-pricing.service";
import { ShopProductCategoryModule } from "src/merchant/shop-product-category/shop-product-category.module";

@Module({
  imports: [
    CommentModule,
    SkuModule,
    PrismaModule,
    ProductInventoryLogModule,
    PriceInquiryModule,
    ProductAttributesTplModule,
    ProductServicesModule,
  PanelModule,
  // 为 admin 兼容分类接口提供店铺分类服务（支持 X-Shop-Id 过滤）
  ShopProductCategoryModule,
  ],
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
    AdminApiProductInventoryLogCompatController,
    AdminApiPriceInquiryCompatController,
    AdminApiProductAttributesTplCompatController,
    AdminApiProductServicesCompatController,
    AdminApiProductCreateCompatController,
  ],
  providers: [
    ProductService,
    ProductDetailService,
    ProductPricingService,
    CategoryService,
    BrandService,
    ProductGroupCompatService,
    AdminCommentCompatService,
    ShippingTplService,
    AdminProductBatchCompatService,
  ],
  exports: [
    ProductService,
    ProductDetailService,
    ProductPricingService,
    CategoryService,
    BrandService,
  ],
})
export class ProductModule {}
