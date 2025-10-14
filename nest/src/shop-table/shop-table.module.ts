// @ts-nocheck
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShopTableService } from './shop-table.service';
import { AdminShopTableCompatController } from './shop-table.controller';

@Module({
  imports: [PrismaModule],
  providers: [ShopTableService],
  controllers: [AdminShopTableCompatController],
  exports: [ShopTableService],
})
export class ShopTableModule {}
