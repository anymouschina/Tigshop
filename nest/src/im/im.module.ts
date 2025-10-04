import { Module } from '@nestjs/common';
import { ImConversationController } from './im_conversation.controller';
import { ImConversationService } from './im_conversation.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ImConversationController],
  providers: [ImConversationService, PrismaService],
  exports: [ImConversationService],
})
export class ImModule {}
