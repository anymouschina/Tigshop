import { Module } from "@nestjs/common";
import { LogController } from "./log/log.controller";
import { CommonConfigController } from "./config/config.controller";
import { CommonConfigService } from "./config/config.service";
import { ConfigModule } from "../config/config.module";
import { RecommendModule } from "./recommend/recommend.module";
import { ApiCsrfController } from "./api-csrf.controller";
import { CommonCsrfService } from "./services/common-csrf.service";
import { TipsManageModule } from "./tips-manage/tips-manage.module";
import { CommonPcController } from "./pc/pc.controller";
import { CommonUtilController } from "./util/util.controller";
import { WechatModule } from "../wechat/wechat.module";
import { CurrencyController } from "./currency/currency.controller";

@Module({
  imports: [ConfigModule, RecommendModule, TipsManageModule, WechatModule],
  controllers: [LogController, CommonConfigController, ApiCsrfController, CommonPcController, CommonUtilController, CurrencyController],
  providers: [CommonConfigService, CommonCsrfService],
})
export class CommonModule {}
