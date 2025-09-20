import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { SmsModule } from '../../common/sms/sms.module';
import { EmailModule } from '../../common/email/email.module';
import { UserOauthModule } from '../user-oauth.module';

@Module({
  imports: [
    ConfigModule,
    SmsModule,
    EmailModule,
    UserOauthModule,
  ],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}