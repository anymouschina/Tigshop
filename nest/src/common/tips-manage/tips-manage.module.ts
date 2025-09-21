// @ts-nocheck
import { Module } from "@nestjs/common";
import { TipsManageController } from "./tips-manage.controller";
import { TipsManageService } from "./tips-manage.service";

@Module({
  imports: [],
  controllers: [TipsManageController],
  providers: [TipsManageService],
  exports: [TipsManageService],
})
export class TipsManageModule {}
