// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserHistoryService } from "./history.service";
import { UserHistoryController } from "./history.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [UserHistoryController],
  providers: [UserHistoryService],
  exports: [UserHistoryService],
})
export class UserHistoryModule {}
