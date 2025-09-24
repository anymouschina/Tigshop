import { Module } from "@nestjs/common";
import { LogController } from "./log/log.controller";
import { CommonConfigController } from "./config/config.controller";
import { CommonConfigService } from "./config/config.service";
import { ConfigModule } from "../config/config.module";

@Module({
  imports: [ConfigModule],
  controllers: [LogController, CommonConfigController],
  providers: [CommonConfigService],
})
export class CommonModule {}
