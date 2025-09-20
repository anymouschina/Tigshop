// @ts-nocheck
import { Module } from "@nestjs/common";
import { PrinterController } from "./printer.controller";
import { PrinterService } from "./printer.service";
import { PrismaModule } from "../../common/services/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}
