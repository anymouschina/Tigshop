// @ts-nocheck
import { Module } from "@nestjs/common";
import { SalesStatisticsController } from "./sales-statistics.controller";
import { SalesStatisticsService } from "./sales-statistics.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SalesStatisticsController],
  providers: [SalesStatisticsService],
  exports: [SalesStatisticsService],
})
export class StatisticsModule {}
