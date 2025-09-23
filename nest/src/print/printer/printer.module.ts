// @ts-nocheck
import { Module } from "@nestjs/common";
import { PrinterController } from "./printer.controller";
import { PrinterService } from "./printer.service";

@Module({
  imports: [],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}
