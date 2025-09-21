// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserMessageLogService } from "./user-message-log.service";
import { UserMessageLogController } from "./user-message-log.controller";


@Module({
  controllers: [UserMessageLogController],
  providers: [UserMessageLogService, ],
  exports: [UserMessageLogService],
})
export class UserMessageLogModule {}
