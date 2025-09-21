// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserRankService } from "./user-rank.service";
import { UserRankController } from "./user-rank.controller";


@Module({
  controllers: [UserRankController],
  providers: [UserRankService, ],
  exports: [UserRankService],
})
export class UserRankModule {}
