// @ts-nocheck
import { Module } from "@nestjs/common";
import { PrintConfigController } from "./print-config.controller";
import { PrintConfigService } from "./print-config.service";

@Module({
  imports: [],
  controllers: [PrintConfigController],
  providers: [PrintConfigService],
  exports: [PrintConfigService],
})
export class PrintConfigModule {}
