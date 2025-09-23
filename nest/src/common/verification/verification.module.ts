// @ts-nocheck
import { Module } from "@nestjs/common";
import {
  VerificationController,
  PublicVerificationController,
} from "./verification.controller";
import { VerificationService } from "./verification.service";

import { AuthModule } from "../../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [VerificationController, PublicVerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
