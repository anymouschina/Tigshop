import { Module } from '@nestjs/common';
import { ImConversationController } from './im_conversation.controller';
import { ImConversationService } from './im_conversation.service';
import { ImServantController } from './im_servant.controller';
import { ImServantService } from './im_servant.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ImConversationController, ImServantController],
  providers: [ImConversationService, ImServantService, PrismaService],
  exports: [ImConversationService, ImServantService],
})
export class ImModule {}
