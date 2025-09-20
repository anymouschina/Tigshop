import { Module } from "@nestjs/common";
import { DecorateController } from "./decorate.controller";
import { UserDecorateController } from "./user-decorate.controller";
import { DecorateService } from "./decorate.service";
import { UserDecorateService } from "./user-decorate.service";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [DecorateController, UserDecorateController],
  providers: [DecorateService, UserDecorateService, PrismaService],
  exports: [DecorateService, UserDecorateService],
})
export class DecorateModule {}