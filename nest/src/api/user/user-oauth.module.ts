import { Module } from '@nestjs/common';
import { UserOauthController } from './user-oauth.controller';
import { UserOauthService } from './user-oauth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserRegistModule } from '../user-regist.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_SECRET || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    UserRegistModule,
    HttpModule,
  ],
  controllers: [UserOauthController],
  providers: [UserOauthService, PrismaService],
  exports: [UserOauthService],
})
export class UserOauthModule {}