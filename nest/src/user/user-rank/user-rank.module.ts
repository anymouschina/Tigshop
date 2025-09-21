// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserRankService } from "./user-rank.service";
import { UserRankController } from "./user-rank.controller";
import { PrismaService } from "src/prisma.service";

@Module({
  controllers: [UserRankController],
  providers: [UserRankService, PrismaService],
  exports: [UserRankService],
})
export class UserRankModule {}
