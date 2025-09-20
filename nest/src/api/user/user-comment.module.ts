// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserCommentController } from "./user-comment.controller";
import { UserCommentService } from "./user-comment.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [UserCommentController],
  providers: [UserCommentService, PrismaService],
  exports: [UserCommentService],
})
export class UserCommentModule {}
