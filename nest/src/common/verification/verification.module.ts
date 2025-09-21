// @ts-nocheck
import { Module } from "@nestjs/common";
import { VerificationController, PublicVerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";
import { PrismaModule } from "../../common/services/prisma.module";
import { AuthModule } from "../../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VerificationController, PublicVerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
