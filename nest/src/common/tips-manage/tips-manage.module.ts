// @ts-nocheck
import { Module } from "@nestjs/common";
import { TipsManageController } from "./tips-manage.controller";
import { TipsManageService } from "./tips-manage.service";
import { PrismaModule } from "../../common/services/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [TipsManageController],
  providers: [TipsManageService],
  exports: [TipsManageService],
})
export class TipsManageModule {}
