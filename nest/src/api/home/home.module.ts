// @ts-nocheck
import { Module } from "@nestjs/common";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";
import { ShareController } from "./share.controller";
import { ShareService } from "./share.service";


@Module({
  controllers: [HomeController, ShareController],
  providers: [HomeService, ShareService, ],
  exports: [HomeService, ShareService],
})
export class HomeModule {}
