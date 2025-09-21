// @ts-nocheck
import { Module } from "@nestjs/common";
import { ShareService } from "./share.service";
import { ShareController } from "./share.controller";

@Module({
  imports: [],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
