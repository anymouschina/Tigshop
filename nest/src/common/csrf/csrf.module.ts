// @ts-nocheck
import { Module } from "@nestjs/common";
import { CsrfController, PublicCsrfController } from "./csrf.controller";
import { CsrfService } from "./csrf.service";
import { AuthModule } from "../../auth/auth.module";
import { PrismaModule } from "src/prisma/prisma.module";
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CsrfController, PublicCsrfController],
  providers: [CsrfService],
  exports: [CsrfService],
})
export class CsrfModule {}