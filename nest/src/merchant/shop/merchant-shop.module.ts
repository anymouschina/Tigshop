import { Module } from '@nestjs/common';
import { MerchantShopService } from './merchant-shop.service';
import { MerchantShopController } from './merchant-shop.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MerchantShopController],
  providers: [MerchantShopService],
  exports: [MerchantShopService],
})
export class MerchantShopModule {}