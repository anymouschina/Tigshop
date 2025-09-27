import { Module } from "@nestjs/common";
import { LogController } from "./log/log.controller";
import { CommonConfigController } from "./config/config.controller";
import { CommonConfigService } from "./config/config.service";
import { ConfigModule } from "../config/config.module";
import { RecommendModule } from "./recommend/recommend.module";
import { ApiCsrfController } from "./api-csrf.controller";
import { CommonCsrfService } from "./services/common-csrf.service";
import { TipsManageModule } from "./tips-manage/tips-manage.module";

@Module({
  imports: [ConfigModule, RecommendModule, TipsManageModule],
  controllers: [LogController, CommonConfigController, ApiCsrfController],
  providers: [CommonConfigService, CommonCsrfService],
})
export class CommonModule {}
