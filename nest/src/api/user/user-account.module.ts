// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserAccountController } from "./user-account.controller";
import { UserAccountService } from "./user-account.service";

import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  controllers: [UserAccountController],
  providers: [UserAccountService, ],
  exports: [UserAccountService],
})
export class UserAccountModule {}
