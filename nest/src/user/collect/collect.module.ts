// @ts-nocheck
import { Module } from "@nestjs/common";
import { CollectService } from "./collect.service";
import { CollectController } from "./collect.controller";
import { CollectProductCompatController } from "./collect-product.compat.controller";

@Module({
  imports: [],
  controllers: [CollectController, CollectProductCompatController],
  providers: [CollectService],
  exports: [CollectService],
})
export class CollectModule {}
