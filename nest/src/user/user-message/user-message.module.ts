import { Module } from '@nestjs/common';
import { UserMessageService } from './user-message.service';
import { UserMessageController } from './user-message.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UserMessageController],
  providers: [UserMessageService, PrismaService],
  exports: [UserMessageService],
})
export class UserMessageModule {}