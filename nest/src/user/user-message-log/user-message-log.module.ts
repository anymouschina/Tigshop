// @ts-nocheck
import { Module } from '@nestjs/common';
import { UserMessageLogService } from './user-message-log.service';
import { UserMessageLogController } from './user-message-log.controller';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [UserMessageLogController],
  providers: [UserMessageLogService, PrismaService],
  exports: [UserMessageLogService],
})
export class UserMessageLogModule {}
