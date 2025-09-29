// @ts-nocheck
import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { AdminPrintCompatController } from "./admin-print-compat.controller";

@Module({
  imports: [PrismaModule],
  controllers: [AdminPrintCompatController],
})
export class PrintModule {}
