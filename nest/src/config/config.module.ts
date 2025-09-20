// @ts-nocheck
import { Module, Global } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { AppConfigService } from "./config.service";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    AppConfigService,
    {
      provide: "CONFIG",
      useFactory: (configService: AppConfigService) => ({
        port: configService.port,
        databaseUrl: configService.databaseUrl,
        jwtSecret: configService.jwtSecret,
      }),
      inject: [AppConfigService],
    },
  ],
  exports: ["CONFIG", AppConfigService],
})
export class ConfigModule {}
