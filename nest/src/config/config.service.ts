// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    return this.configService.get<number>("port", 3000);
  }

  get databaseUrl(): string {
    return this.configService.get<string>("DATABASE_URL", "postgresql://username:password@localhost:5432/tigshop");
  }

  get wechatAppId(): string {
    return this.configService.get<string>("WECHAT_APP_ID", "");
  }

  get wechatAppSecret(): string {
    return this.configService.get<string>("WECHAT_APP_SECRET", "");
  }

  get jwtSecret(): string {
    return this.configService.get<string>("JWT_SECRET", "your-secret-key");
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>("JWT_EXPIRES_IN", "7d");
  }
}
