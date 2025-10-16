// @ts-nocheck
import { Module } from "@nestjs/common";
import { CommentService } from "./comment.service";
import { UserCommentApiCompatController } from "./user-comment.api-compat.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { SettingModule } from "src/setting/setting.module";

@Module({
  imports: [PrismaModule, SettingModule],
  controllers: [UserCommentApiCompatController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
