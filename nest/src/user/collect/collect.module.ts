// @ts-nocheck
import { Module } from "@nestjs/common";
import { CollectService } from "./collect.service";
import { CollectController } from "./collect.controller";

@Module({
  imports: [],
  controllers: [CollectController],
  providers: [CollectService],
  exports: [CollectService],
})
export class CollectModule {}
