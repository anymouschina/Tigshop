// @ts-nocheck
import { Module } from '@nestjs/common';
import { UserSignController } from './user-sign.controller';
import { UserSignService } from './user-sign.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [UserSignController],
  providers: [UserSignService, PrismaService],
  exports: [UserSignService],
})
export class UserSignModule {}
