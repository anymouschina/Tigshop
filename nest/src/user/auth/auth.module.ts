// @ts-nocheck
import { Module } from '@nestjs/common';
import { UserAuthService } from './auth.service';
import { UserAuthController } from './auth.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MailModule,
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService],
  exports: [UserAuthService],
})
export class UserAuthModule {}
