// @ts-nocheck
import { Module } from "@nestjs/common";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";
import { ProductDetailService } from "../product/product-detail.service";

@Module({
  imports: [],
  controllers: [HomeController],
  providers: [HomeService, ProductDetailService],
  exports: [HomeService],
})
export class HomeModule {}
