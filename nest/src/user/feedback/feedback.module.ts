// @ts-nocheck
import { Module } from "@nestjs/common";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { UserFeedbackController } from "./user-feedback.controller";
import { UserFeedbackService } from "./user-feedback.service";

@Module({
  imports: [],
  controllers: [FeedbackController, UserFeedbackController],
  providers: [FeedbackService, UserFeedbackService],
  exports: [FeedbackService, UserFeedbackService],
})
export class FeedbackModule {}
