// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserMessageController } from "./user-message.controller";
import { UserMessageService } from "./user-message.service";


@Module({
  controllers: [UserMessageController],
  providers: [UserMessageService, ],
  exports: [UserMessageService],
})
export class UserMessageModule {}
