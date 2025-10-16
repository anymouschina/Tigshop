import { Module } from "@nestjs/common";
import { ImConversationController } from "./im_conversation.controller";
import { ImConversationService } from "./im_conversation.service";
import { ImServantController } from "./im_servant.controller";
import { ImServantService } from "./im_servant.service";
import { PrismaService } from "../prisma/prisma.service";
import { ImConfigController } from "./im_config.controller";
import { ImConfigService } from "./im_config.service";
import { ImGateway } from "./im.gateway";

@Module({
  controllers: [
    ImConversationController,
    ImServantController,
    ImConfigController,
  ],
  providers: [
    ImConversationService,
    ImServantService,
    ImConfigService,
    PrismaService,
    ImGateway,
  ],
  exports: [
    ImConversationService,
    ImServantService,
    ImConfigService,
    ImGateway,
  ],
})
export class ImModule {}
