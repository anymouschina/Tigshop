// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserAuthService } from "./auth.service";
import { UserAuthController } from "./auth.controller";
import { AuthModule } from "../../auth/auth.module";
import { MailModule } from "../../mail/mail.module";
import { SmsModule } from "../../../common/sms/sms.module";
import { ConfigModule } from "../../config/config.module";

@Module({
  imports: [AuthModule, MailModule, SmsModule, ConfigModule],
  controllers: [UserAuthController],
  providers: [UserAuthService],
  exports: [UserAuthService],
})
export class UserAuthModule {}
