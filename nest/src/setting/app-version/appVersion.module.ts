// @ts-nocheck
import { Module } from "@nestjs/common";
import { AppVersionService } from "./appVersion.service";
import { AppVersionController } from "./appVersion.controller";

@Module({
  imports: [],
  controllers: [AppVersionController],
  providers: [AppVersionService],
  exports: [AppVersionService],
})
export class AppVersionModule {}
