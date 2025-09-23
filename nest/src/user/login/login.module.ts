// @ts-nocheck
import { Module } from "@nestjs/common";
import { LoginController } from "./login.controller";
import { LoginService } from "./login.service";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../../auth/auth.module";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [
    JwtModule.register({
      secret: "your-secret-key", // 应该从环境变量获取
      signOptions: { expiresIn: "7d" },
    }),
    AuthModule,
    RedisModule,
  ],
  controllers: [LoginController],
  providers: [LoginService],
  exports: [LoginService],
})
export class LoginModule {}
