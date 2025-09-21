// @ts-nocheck
import { Module } from "@nestjs/common";
import { FriendLinksService } from "./friendLinks.service";
import { FriendLinksController } from "./friendLinks.controller";

@Module({
  imports: [],
  controllers: [FriendLinksController],
  providers: [FriendLinksService],
  exports: [FriendLinksService],
})
export class FriendLinksModule {}
