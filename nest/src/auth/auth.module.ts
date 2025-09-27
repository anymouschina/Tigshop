// @ts-nocheck
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AdminJwtStrategy } from "./strategies/admin-jwt.strategy";
import { AdminJwtAuthGuard } from "./guards/admin-jwt-auth.guard";
import { AdminRolesGuard } from "./guards/admin-roles.guard";
import { ConfigModule } from "../config/config.module";

import { ScheduleModule } from "@nestjs/schedule";
import { CsrfService } from "./services/csrf.service";
import { CaptchaService } from "./services/captcha.service";
import { UsernameGeneratorService } from "./services/username-generator.service";
import { VerificationCodeService } from "./services/verification-code.service";
import { WechatOAuthService } from "./services/wechat-oauth.service";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [
    RedisModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: ["CONFIG"],
      useFactory: async (config: any) => ({
        secret: config.jwtSecret || "fallback-secret-key"
      }),
    }),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    AdminJwtStrategy,
    AdminJwtAuthGuard,
    AdminRolesGuard,
    CsrfService,
    CaptchaService,
    UsernameGeneratorService,
    VerificationCodeService,
    WechatOAuthService,
  ],
  exports: [
    AuthService,
    CsrfService,
    CaptchaService,
    VerificationCodeService,
    WechatOAuthService,
  ],
})
export class AuthModule {}
