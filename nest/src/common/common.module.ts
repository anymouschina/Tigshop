import { Module } from "@nestjs/common";
import { LogController } from "./log/log.controller";
import { CommonConfigController } from "./config/config.controller";
import { CommonConfigService } from "./config/config.service";
import { ConfigModule } from "../config/config.module";
import { RecommendModule } from "./recommend/recommend.module";

@Module({
  imports: [ConfigModule, RecommendModule],
  controllers: [LogController, CommonConfigController],
  providers: [CommonConfigService],
})
export class CommonModule {}
