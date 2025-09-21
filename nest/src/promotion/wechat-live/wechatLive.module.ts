// @ts-nocheck
import { Module } from "@nestjs/common";
import { WechatLiveService } from "./wechatLive.service";
import { WechatLiveController } from "./wechatLive.controller";

@Module({
  imports: [],
  controllers: [WechatLiveController],
  providers: [WechatLiveService],
  exports: [WechatLiveService],
})
export class WechatLiveModule {}
