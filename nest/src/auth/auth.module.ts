// @ts-nocheck
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { ConfigModule } from "../config/config.module";
import { DatabaseService } from "../database/database.service";
import { ScheduleModule } from "@nestjs/schedule";
import { DatabaseModule } from "../database/database.module";
import { CsrfService } from "./services/csrf.service";
import { CaptchaService } from "./services/captcha.service";
import { UsernameGeneratorService } from "./services/username-generator.service";
import { VerificationCodeService } from "./services/verification-code.service";
import { WechatOAuthService } from "./services/wechat-oauth.service";

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: ["CONFIG"],
      useFactory: async (config: any) => ({
        secret: config.jwtSecret || "fallback-secret-key",
        signOptions: {
          expiresIn: "7d",
        },
      }),
    }),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    CsrfService,
    CaptchaService,
    UsernameGeneratorService,
    VerificationCodeService,
    WechatOAuthService,
  ],
  exports: [AuthService, CsrfService, CaptchaService, VerificationCodeService, WechatOAuthService],
})
export class AuthModule {}
