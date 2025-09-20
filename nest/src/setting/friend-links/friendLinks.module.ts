// @ts-nocheck
import { Module } from "@nestjs/common";
import { FriendLinksService } from "./friendLinks.service";
import { FriendLinksController } from "./friendLinks.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [FriendLinksController],
  providers: [FriendLinksService],
  exports: [FriendLinksService],
})
export class FriendLinksModule {}
