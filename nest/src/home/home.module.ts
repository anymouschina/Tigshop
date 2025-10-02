// @ts-nocheck
import { Module } from "@nestjs/common";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";
import { HomeSharePublicController } from "./home-share-public.controller";
import { ProductModule } from "src/product/product.module";

@Module({
  imports: [ProductModule],
  controllers: [HomeController, HomeSharePublicController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
