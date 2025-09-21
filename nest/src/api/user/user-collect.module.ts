// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserCollectController } from "./user-collect.controller";
import { UserCollectService } from "./user-collect.service";


@Module({
  controllers: [UserCollectController],
  providers: [UserCollectService, ],
  exports: [UserCollectService],
})
export class UserCollectModule {}
