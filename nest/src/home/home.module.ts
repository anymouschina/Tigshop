// @ts-nocheck
import { Module } from "@nestjs/common";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";
import { ProductDetailService } from "../product/product-detail.service";
import { HomeSharePublicController } from "./home-share-public.controller";

@Module({
  imports: [],
  controllers: [HomeController, HomeSharePublicController],
  providers: [HomeService, ProductDetailService],
  exports: [HomeService],
})
export class HomeModule {}
