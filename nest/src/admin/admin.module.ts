// @ts-nocheck
import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminApiCsrfController } from "./adminapi-csrf.controller";
import { AdminLoginController } from "./admin-login.controller";
import { AdminService } from "./admin.service";
import { AuthorityModule } from "./authority/authority.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";
import { AdminAccountCompatController } from "./admin-account-compat.controller";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [
    AuthModule,
    RedisModule, // 提供 RedisService 以供 AdminLoginController 注入
    AuthorityModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [
    AdminController,
    AdminApiCsrfController,
    AdminLoginController,
    AdminAccountCompatController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
