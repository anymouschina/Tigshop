// @ts-nocheck
import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminApiCsrfController } from "./adminapi-csrf.controller";
import { AdminService } from "./admin.service";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [AdminController, AdminApiCsrfController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
