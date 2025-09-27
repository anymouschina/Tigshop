// @ts-nocheck
import { Module } from "@nestjs/common";
import { TipsManageController } from "./tips-manage.controller";
import { TipsManageService } from "./tips-manage.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TipsManageController],
  providers: [TipsManageService],
  exports: [TipsManageService],
})
export class TipsManageModule {}
