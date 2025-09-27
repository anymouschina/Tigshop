// @ts-nocheck
import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { LocalStorageStrategy } from "./strategies/local-storage.strategy";
import { OssStorageStrategy } from "./strategies/oss-storage.strategy";
import { StorageStrategyFactory } from "./storage-strategy.factory";

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    LocalStorageStrategy,
    OssStorageStrategy,
    StorageStrategyFactory,
  ],
  exports: [UploadService],
})
export class UploadModule {}
