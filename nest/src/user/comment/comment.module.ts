// @ts-nocheck
import { Module } from "@nestjs/common";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";
import { UserCommentApiCompatController } from "./user-comment.api-compat.controller";

@Module({
  imports: [],
  controllers: [CommentController, UserCommentApiCompatController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
