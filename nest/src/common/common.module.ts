import { Module } from "@nestjs/common";
import { LogController } from "./log/log.controller";
import { CommonConfigController } from "./config/config.controller";
import { CommonConfigService } from "./config/config.service";
import { ConfigModule } from "../config/config.module";
import { RecommendModule } from "./recommend/recommend.module";
import { ApiCsrfController } from "./api-csrf.controller";

@Module({
  imports: [ConfigModule, RecommendModule],
  controllers: [LogController, CommonConfigController, ApiCsrfController],
  providers: [CommonConfigService],
})
export class CommonModule {}
