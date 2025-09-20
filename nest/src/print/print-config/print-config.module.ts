// @ts-nocheck
import { Module } from "@nestjs/common";
import { PrintConfigController } from "./print-config.controller";
import { PrintConfigService } from "./print-config.service";
import { PrismaModule } from "../../common/services/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PrintConfigController],
  providers: [PrintConfigService],
  exports: [PrintConfigService],
})
export class PrintConfigModule {}
