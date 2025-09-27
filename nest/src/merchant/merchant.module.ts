import { Module } from '@nestjs/common';
import { MerchantShopModule } from './shop/merchant-shop.module';
import { MerchantService } from './merchant.service';

@Module({
  imports: [MerchantShopModule],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}