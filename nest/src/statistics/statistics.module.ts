// @ts-nocheck
import { Module } from "@nestjs/common";
import { SalesStatisticsController } from "./sales-statistics.controller";
import { AccessStatisticsController } from "./access-statistics.controller";
import { GeneralStatisticsController } from "./general-statistics.controller";
import { SalesStatisticsService } from "./sales-statistics.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";
import { PanelService } from "../panel/panel.service";
import { UserStatisticsController } from "./user-statistics.controller";
import { UserStatisticsService } from "./user-statistics.service";
import { AccessStatisticsService } from "./access-statistics.service";
import { GeneralStatisticsService } from "./general-statistics.service";
import { StatisticsFacadeService } from "./statistics-facade.service";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [
    SalesStatisticsController,
    AccessStatisticsController,
    GeneralStatisticsController,
    UserStatisticsController,
  ],
  providers: [
    SalesStatisticsService,
    UserStatisticsService,
    AccessStatisticsService,
    GeneralStatisticsService,
    StatisticsFacadeService,
    PanelService,
  ],
  exports: [
    SalesStatisticsService,
    UserStatisticsService,
    AccessStatisticsService,
    GeneralStatisticsService,
    StatisticsFacadeService,
  ],
})
export class StatisticsModule {}
