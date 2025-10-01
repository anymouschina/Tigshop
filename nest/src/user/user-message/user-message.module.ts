import { Module } from "@nestjs/common";
import { UserMessageService } from "./user-message.service";
import { UserMessageController } from "./user-message.controller";
import { UserMessageApiCompatController } from "./user-message.api-compat.controller";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [UserMessageController, UserMessageApiCompatController],
  providers: [UserMessageService, PrismaService],
  exports: [UserMessageService],
})
export class UserMessageModule {}
