// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserCollectController } from "./user-collect.controller";
import { UserCollectService } from "./user-collect.service";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [UserCollectController],
  providers: [UserCollectService, PrismaService],
  exports: [UserCollectService],
})
export class UserCollectModule {}
