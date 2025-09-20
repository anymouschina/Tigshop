// @ts-nocheck
import { Module } from "@nestjs/common";
import { WechatController } from "./wechat.controller";
import { WechatService } from "./wechat.service";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [HttpModule, DatabaseModule],
  controllers: [WechatController],
  providers: [WechatService],
  exports: [WechatService],
})
export class WechatModule {}
