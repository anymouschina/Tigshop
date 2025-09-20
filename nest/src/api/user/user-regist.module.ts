// @ts-nocheck
import { Module } from '@nestjs/common';
import { UserRegistController } from './user-regist.controller';
import { UserRegistService } from './user-regist.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SmsModule } from '../../common/sms/sms.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_SECRET || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    SmsModule,
    EmailModule,
  ],
  controllers: [UserRegistController],
  providers: [UserRegistService, PrismaService],
  exports: [UserRegistService],
})
export class UserRegistModule {}
