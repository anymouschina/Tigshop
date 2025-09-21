// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserCommentController } from "./user-comment.controller";
import { UserCommentService } from "./user-comment.service";


@Module({
  controllers: [UserCommentController],
  providers: [UserCommentService, ],
  exports: [UserCommentService],
})
export class UserCommentModule {}
