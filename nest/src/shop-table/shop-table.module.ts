// @ts-nocheck
import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ShopTableService } from "./shop-table.service";
import {
  AdminShopTableCompatController,
  PublicQrcodeController,
} from "./shop-table.controller";
import { WechatModule } from "../wechat/wechat.module";

@Module({
  imports: [PrismaModule, WechatModule],
  providers: [ShopTableService],
  controllers: [AdminShopTableCompatController, PublicQrcodeController],
  exports: [ShopTableService],
})
export class ShopTableModule {}
