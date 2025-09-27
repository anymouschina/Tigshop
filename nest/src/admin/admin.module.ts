// @ts-nocheck
import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminApiCsrfController } from "./adminapi-csrf.controller";
import { AdminLoginController } from "./admin-login.controller";
import { AdminService } from "./admin.service";
import { AuthorityModule } from "./authority/authority.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    AuthorityModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [AdminController, AdminApiCsrfController, AdminLoginController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
