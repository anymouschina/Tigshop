import { Module } from "@nestjs/common";
import { MerchantShopModule } from "./shop/merchant-shop.module";
import { ShopProductCategoryModule } from "./shop-product-category/shop-product-category.module";
import { MerchantService } from "./merchant.service";

@Module({
  imports: [MerchantShopModule, ShopProductCategoryModule],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
